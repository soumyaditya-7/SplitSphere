/**
 * Stellar blockchain service layer
 * Handles wallet connection, balance fetching, and XLM transactions
 */
import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Check if Freighter wallet extension is installed
 */
export async function isFreighterInstalled() {
  try {
    const { isConnected } = await import('@stellar/freighter-api');
    const connected = await isConnected();
    return connected;
  } catch {
    return false;
  }
}

/**
 * Request wallet access and get the user's public key
 */
export async function connectWallet() {
  const { requestAccess } = await import('@stellar/freighter-api');
  const accessObj = await requestAccess();

  if (accessObj.error) {
    throw new Error(accessObj.error);
  }

  return accessObj.address;
}

/**
 * Get the public key of the currently connected wallet
 */
export async function getPublicKey() {
  const { getAddress } = await import('@stellar/freighter-api');
  const addressObj = await getAddress();

  if (addressObj.error) {
    throw new Error(addressObj.error);
  }

  return addressObj.address;
}

/**
 * Fetch XLM balance for a given public key
 */
export async function fetchBalance(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(
      (b) => b.asset_type === 'native'
    );
    return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  } catch (error) {
    if (error?.response?.status === 404) {
      // Account not funded yet
      return 0;
    }
    throw error;
  }
}

/**
 * Build, sign (via Freighter), and submit a payment transaction
 * @param {string} senderPublicKey - Sender's Stellar address
 * @param {string} destinationPublicKey - Recipient's Stellar address
 * @param {string} amount - Amount of XLM to send
 * @param {string} memo - Optional memo text
 * @returns {object} Transaction result with hash
 */
export async function sendPayment(senderPublicKey, destinationPublicKey, amount, memo = '') {
  const { signTransaction } = await import('@stellar/freighter-api');

  // Load sender account
  const account = await server.loadAccount(senderPublicKey);

  // Build transaction
  let builder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationPublicKey,
        asset: StellarSdk.Asset.native(),
        amount: parseFloat(amount).toFixed(7),
      })
    )
    .setTimeout(60);

  if (memo) {
    builder = builder.addMemo(StellarSdk.Memo.text(memo.slice(0, 28)));
  }

  const transaction = builder.build();
  const xdr = transaction.toXDR();

  // Sign via Freighter
  const signedResponse = await signTransaction(xdr, {
    network: 'TESTNET',
    networkPassphrase: NETWORK_PASSPHRASE,
    address: senderPublicKey,
  });

  if (signedResponse.error) {
    throw new Error(signedResponse.error);
  }

  // Submit transaction
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedResponse.signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.submitTransaction(signedTx);

  return {
    success: true,
    hash: result.hash,
    ledger: result.ledger,
  };
}

/**
 * Validate a Stellar public key
 */
export function isValidStellarAddress(address) {
  try {
    StellarSdk.Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate an address for display (e.g., GABCD...WXYZ)
 */
export function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Get Stellar Expert link for a transaction
 */
export function getExplorerLink(hash) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}
