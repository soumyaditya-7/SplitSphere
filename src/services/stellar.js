/**
 * Stellar blockchain service layer
 * Handles multi-wallet connection, balance fetching, and XLM transactions
 * Supports: Freighter, xBull, Albedo, and more via StellarWalletsKit-style abstraction
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  WalletNotFoundError,
  TransactionRejectedError,
  InsufficientBalanceError,
  parseError,
  TX_STATUS,
} from './errors';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

import { Horizon } from '@stellar/stellar-sdk';
const server = new Horizon.Server(HORIZON_URL);

// ─── Multi-Wallet Abstraction ──────────────────────────────────────────────

/**
 * Detect which wallets are currently installed/available
 */
export async function detectAvailableWallets() {
  const available = [];

  try {
    const { isConnected } = await import('@stellar/freighter-api');
    const connected = await isConnected();
    if (connected) available.push('freighter');
  } catch (e) {
    const _ignored = e;
  }

  // Check xBull (window.xBullSDK)
  if (typeof window !== 'undefined' && window.xBullSDK) {
    available.push('xbull');
  }

  // Albedo is always available (web-based, no extension needed)
  available.push('albedo');

  return available;
}

/**
 * Connect to a specific wallet by ID
 * @param {string} walletId - One of: 'freighter', 'xbull', 'albedo', 'lobstr', 'hana', 'rabet'
 * @returns {object} { address, walletId }
 */
export async function connectWalletById(walletId) {
  switch (walletId) {
    case 'freighter':
      return await connectFreighter();
    case 'xbull':
      return await connectXBull();
    case 'albedo':
      return await connectAlbedo();
    default:
      // For wallets that need their extension, try Freighter-style connection
      return await connectFreighter();
  }
}

/**
 * Connect via Freighter wallet
 */
async function connectFreighter() {
  try {
    const { isConnected, requestAccess } = await import('@stellar/freighter-api');
    const connected = await isConnected();

    if (!connected) {
      throw new WalletNotFoundError('Freighter wallet not detected. Please install the extension.');
    }

    const accessObj = await requestAccess();

    if (accessObj.error) {
      if (accessObj.error.includes('rejected') || accessObj.error.includes('denied')) {
        throw new TransactionRejectedError(accessObj.error);
      }
      throw new Error(accessObj.error);
    }

    return { address: accessObj.address, walletId: 'freighter' };
  } catch (error) {
    if (error instanceof WalletNotFoundError || error instanceof TransactionRejectedError) {
      throw error;
    }
    throw new WalletNotFoundError('Freighter wallet not available. Please install it from freighter.app');
  }
}

/**
 * Connect via xBull wallet
 */
async function connectXBull() {
  if (typeof window === 'undefined' || !window.xBullSDK) {
    throw new WalletNotFoundError('xBull wallet not detected. Please install xBull extension.');
  }

  try {
    const { publicKey } = await window.xBullSDK.connect({
      canRequestPublicKey: true,
      canRequestSign: true,
    });
    return { address: publicKey, walletId: 'xbull' };
  } catch (error) {
    throw parseError(error);
  }
}

/**
 * Connect via Albedo (web-based)
 * Note: Albedo requires its own SDK. For now, redirect users to install a supported wallet.
 */
async function connectAlbedo() {
  throw new WalletNotFoundError(
    'Albedo wallet integration requires the Albedo SDK. Please use Freighter or xBull for now.'
  );
}

/**
 * Sign a transaction using the connected wallet
 * @param {string} walletId - The connected wallet type
 * @param {string} xdr - Transaction XDR to sign
 * @param {object} opts - { networkPassphrase, address }
 * @returns {object} { signedTxXdr }
 */
export async function signTransactionWithWallet(walletId, xdr, opts) {
  try {
    switch (walletId) {
      case 'freighter': {
        const { signTransaction } = await import('@stellar/freighter-api');
        const result = await signTransaction(xdr, {
          network: 'TESTNET',
          networkPassphrase: opts.networkPassphrase || NETWORK_PASSPHRASE,
          address: opts.address,
        });
        if (result.error) {
          throw new TransactionRejectedError(result.error);
        }
        return { signedTxXdr: result.signedTxXdr };
      }

      case 'xbull': {
        if (!window.xBullSDK) throw new WalletNotFoundError('xBull wallet disconnected');
        const signedXdr = await window.xBullSDK.signXDR(xdr, {
          network: opts.networkPassphrase || NETWORK_PASSPHRASE,
        });
        return { signedTxXdr: signedXdr };
      }

      default: {
        // Fallback to Freighter signing
        const { signTransaction } = await import('@stellar/freighter-api');
        const result = await signTransaction(xdr, {
          network: 'TESTNET',
          networkPassphrase: opts.networkPassphrase || NETWORK_PASSPHRASE,
          address: opts.address,
        });
        if (result.error) {
          throw new TransactionRejectedError(result.error);
        }
        return { signedTxXdr: result.signedTxXdr };
      }
    }
  } catch (error) {
    if (error instanceof TransactionRejectedError || error instanceof WalletNotFoundError) {
      throw error;
    }
    throw parseError(error);
  }
}

// ─── Legacy Compatible Functions ──────────────────────────────────────────

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
 * Request wallet access and get the user's public key (Freighter)
 */
export async function connectWallet() {
  const result = await connectFreighter();
  return result.address;
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
 * Build, sign (via connected wallet), and submit a payment transaction
 * @param {string} senderPublicKey - Sender's Stellar address
 * @param {string} destinationPublicKey - Recipient's Stellar address
 * @param {string} amount - Amount of XLM to send
 * @param {string} memo - Optional memo text
 * @param {string} walletId - Connected wallet ID (defaults to 'freighter')
 * @param {Function} onStatusChange - Status callback
 * @returns {object} Transaction result with hash
 */
export async function sendPayment(
  senderPublicKey,
  destinationPublicKey,
  amount,
  memo = '',
  walletId = 'freighter',
  onStatusChange = () => {}
) {
  try {
    onStatusChange(TX_STATUS.BUILDING);

    // Check balance first
    const balance = await fetchBalance(senderPublicKey);
    const requiredAmount = parseFloat(amount) + 0.01; // include fee buffer
    if (balance < requiredAmount + 1) {
      throw new InsufficientBalanceError(
        'Insufficient XLM balance for this payment',
        requiredAmount,
        balance
      );
    }

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

    onStatusChange(TX_STATUS.SIGNING);

    // Sign via connected wallet
    const signedResponse = await signTransactionWithWallet(walletId, xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: senderPublicKey,
    });

    onStatusChange(TX_STATUS.SUBMITTING);

    // Submit transaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedResponse.signedTxXdr,
      NETWORK_PASSPHRASE
    );

    const result = await server.submitTransaction(signedTx);

    onStatusChange(TX_STATUS.SUCCESS);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error) {
    onStatusChange(TX_STATUS.FAILED);
    // Re-throw typed errors as-is
    if (
      error instanceof WalletNotFoundError ||
      error instanceof TransactionRejectedError ||
      error instanceof InsufficientBalanceError
    ) {
      throw error;
    }
    throw parseError(error);
  }
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
