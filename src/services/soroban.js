/**
 * Soroban smart contract interaction service
 * Handles reading/writing to the SplitTracker contract on Stellar Testnet
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { Horizon, rpc } from '@stellar/stellar-sdk';
import { TX_STATUS, parseError, InsufficientBalanceError } from './errors';

// ─── Configuration ──────────────────────────────────────────────────────────
// Replace this with your deployed contract ID after running:
//   stellar contract deploy --wasm ... --source ... --network testnet
export const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Initialize servers
const sorobanServer = new rpc.Server(SOROBAN_RPC_URL);
const horizonServer = new Horizon.Server(HORIZON_URL);

/**
 * Record an expense on-chain via the SplitTracker contract
 * @param {string} signerAddress - The connected wallet's public key
 * @param {Function} signTransaction - The signing function from wallet kit
 * @param {string} description - Expense description
 * @param {Object} debtsObj - Object mapping participant address to number XLM amount
 * @param {Function} onStatusChange - Callback for status updates
 * @returns {object} Transaction result
 */
export async function recordExpenseOnChain(
  signerAddress,
  signTransaction,
  description,
  debtsObj,
  onStatusChange = () => {}
) {
  try {
    onStatusChange(TX_STATUS.BUILDING);

    // Load the source account
    const sourceAccount = await sorobanServer.getAccount(signerAddress);

    // Build debts Vec<(Address, i128)>
    const vecEntries = [];
    for (const [address, amount] of Object.entries(debtsObj)) {
      if (amount <= 0 || address === signerAddress) continue;
      const amountStroops = Math.floor(amount * 10_000_000);
      vecEntries.push(
        StellarSdk.xdr.ScVal.scvVec([
          StellarSdk.Address.fromString(address).toScVal(),
          StellarSdk.nativeToScVal(amountStroops, { type: 'i128' }),
        ])
      );
    }
    const debtsScVal = StellarSdk.xdr.ScVal.scvVec(vecEntries);

    // Build the contract call transaction
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'record_expense',
          StellarSdk.Address.fromString(signerAddress).toScVal(),
          StellarSdk.nativeToScVal(description.slice(0, 64), { type: 'string' }),
          debtsScVal
        )
      )
      .setTimeout(60)
      .build();

    // Simulate the transaction to get the correct footprint
    const simulated = await sorobanServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // Assemble the transaction with the simulation result
    const assembledTx = rpc.assembleTransaction(
      transaction,
      simulated
    ).build();

    onStatusChange(TX_STATUS.SIGNING);

    // Sign via wallet kit
    const signedResult = await signTransaction(assembledTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: signerAddress,
    });

    if (signedResult.error) {
      throw new Error(signedResult.error);
    }

    onStatusChange(TX_STATUS.SUBMITTING);

    // Submit the signed transaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedResult.signedTxXdr,
      NETWORK_PASSPHRASE
    );

    const sendResponse = await sorobanServer.sendTransaction(signedTx);

    if (sendResponse.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${sendResponse.errorResult}`);
    }

    // Poll for transaction result
    const result = await pollTransactionStatus(sendResponse.hash);

    if (result.status === 'SUCCESS') {
      onStatusChange(TX_STATUS.SUCCESS);
      return {
        success: true,
        hash: sendResponse.hash,
        ledger: result.ledger,
      };
    } else {
      throw new Error(`Transaction failed on-chain: ${result.status}`);
    }
  } catch (error) {
    onStatusChange(TX_STATUS.FAILED);
    throw parseError(error);
  }
}

/**
 * Poll the Soroban RPC server for a transaction's final status
 */
async function pollTransactionStatus(hash, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await sorobanServer.getTransaction(hash);

    if (response.status === 'SUCCESS') {
      return { status: 'SUCCESS', ledger: response.ledger };
    }

    if (response.status === 'FAILED') {
      return { status: 'FAILED' };
    }

    // NOT_FOUND means still pending, wait and retry
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error('Transaction polling timed out');
}

/**
 * Executes an auto-settlement token transfer via the smart contract
 */
export async function executeSettlementOnChain(
  signerAddress,
  signTransaction,
  creditorAddress,
  amount,
  onStatusChange = () => {}
) {
  try {
    onStatusChange(TX_STATUS.BUILDING);
    const sourceAccount = await sorobanServer.getAccount(signerAddress);

    const NATIVE_TOKEN_ID = StellarSdk.Asset.native().contractId(NETWORK_PASSPHRASE);
    const amountStroops = Math.floor(amount * 10_000_000);

    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'settle_debt',
          StellarSdk.Address.fromString(signerAddress).toScVal(),
          StellarSdk.Address.fromString(creditorAddress).toScVal(),
          StellarSdk.Address.fromString(NATIVE_TOKEN_ID).toScVal(),
          StellarSdk.nativeToScVal(amountStroops, { type: 'i128' })
        )
      )
      .setTimeout(60)
      .build();

    const simulated = await sorobanServer.simulateTransaction(transaction);
    if (rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    const assembledTx = rpc.assembleTransaction(transaction, simulated).build();
    onStatusChange(TX_STATUS.SIGNING);

    const signedResult = await signTransaction(assembledTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: signerAddress,
    });
    if (signedResult.error) throw new Error(signedResult.error);

    onStatusChange(TX_STATUS.SUBMITTING);

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedResult.signedTxXdr,
      NETWORK_PASSPHRASE
    );

    const sendResponse = await sorobanServer.sendTransaction(signedTx);
    if (sendResponse.status === 'ERROR') {
      throw new Error(`Transaction submission failed: ${sendResponse.errorResult}`);
    }

    const result = await pollTransactionStatus(sendResponse.hash);
    if (result.status === 'SUCCESS') {
      onStatusChange(TX_STATUS.SUCCESS);
      return { success: true, hash: sendResponse.hash };
    }
    throw new Error(`Transaction failed on-chain: ${result.status}`);
  } catch (error) {
    onStatusChange(TX_STATUS.FAILED);
    throw parseError(error);
  }
}

/**
 * Read the expense count from the contract (read-only, no signing needed)
 */
export async function getExpenseCount(callerAddress) {
  try {
    const sourceAccount = await sorobanServer.getAccount(callerAddress);
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_expense_count'))
      .setTimeout(30)
      .build();

    const simulated = await sorobanServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulated)) {
      return 0;
    }

    // Parse the result from simulation
    const resultValue = simulated.result?.retval;
    if (resultValue) {
      return StellarSdk.scValToNative(resultValue);
    }
    return 0;
  } catch (error) {
    console.error('Failed to get expense count:', error);
    return 0;
  }
}

/**
 * Read an expense from the contract by ID (read-only)
 */
export async function getExpenseFromChain(callerAddress, expenseId) {
  try {
    const sourceAccount = await sorobanServer.getAccount(callerAddress);
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'get_expense',
          StellarSdk.nativeToScVal(expenseId, { type: 'u64' })
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await sorobanServer.simulateTransaction(transaction);

    if (rpc.Api.isSimulationError(simulated)) {
      return null;
    }

    const resultValue = simulated.result?.retval;
    if (resultValue) {
      return StellarSdk.scValToNative(resultValue);
    }
    return null;
  } catch (error) {
    console.error('Failed to get expense:', error);
    return null;
  }
}

/**
 * Check if the user has enough balance for a transaction
 */
export async function checkBalance(address, requiredAmount) {
  try {
    const account = await horizonServer.loadAccount(address);
    const nativeBalance = account.balances.find(
      (b) => b.asset_type === 'native'
    );
    const available = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

    // Account for base reserve (1 XLM minimum) + fees
    const usable = Math.max(0, available - 1.5);

    if (usable < requiredAmount) {
      throw new InsufficientBalanceError(
        'Insufficient XLM balance',
        requiredAmount,
        available
      );
    }

    return { available, usable };
  } catch (error) {
    if (error instanceof InsufficientBalanceError) throw error;
    throw error;
  }
}

/**
 * Get the Stellar Expert link for the deployed contract
 */
export function getContractExplorerLink() {
  return `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;
}
