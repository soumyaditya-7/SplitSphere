/**
 * Custom error classes for StellarSplit
 * Handles 3 required error types: WalletNotFound, TransactionRejected, InsufficientBalance
 */

export class WalletNotFoundError extends Error {
  constructor(message = 'No Stellar wallet detected') {
    super(message);
    this.name = 'WalletNotFoundError';
    this.type = 'WALLET_NOT_FOUND';
    this.userMessage = 'No compatible wallet found. Please install Freighter, xBull, or another Stellar wallet extension.';
    this.icon = 'wallet';
    this.color = 'orange';
  }
}

export class TransactionRejectedError extends Error {
  constructor(message = 'Transaction was rejected by the user') {
    super(message);
    this.name = 'TransactionRejectedError';
    this.type = 'TRANSACTION_REJECTED';
    this.userMessage = 'You rejected the transaction in your wallet. No funds were sent.';
    this.icon = 'x-circle';
    this.color = 'red';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message = 'Insufficient XLM balance', required = 0, available = 0) {
    super(message);
    this.name = 'InsufficientBalanceError';
    this.type = 'INSUFFICIENT_BALANCE';
    this.required = required;
    this.available = available;
    this.userMessage = `Insufficient balance. You need ${required.toFixed(4)} XLM but only have ${available.toFixed(4)} XLM available.`;
    this.icon = 'coins';
    this.color = 'yellow';
  }
}

/**
 * Parse raw errors from wallet/network into typed errors
 */
export function parseError(error) {
  const msg = (error?.message || error?.toString() || '').toLowerCase();

  // Wallet not found patterns
  if (
    msg.includes('not installed') ||
    msg.includes('not found') ||
    msg.includes('no wallet') ||
    msg.includes('wallet not available') ||
    msg.includes('unable to find') ||
    msg.includes('extension not')
  ) {
    return new WalletNotFoundError(error.message);
  }

  // Transaction rejected patterns
  if (
    msg.includes('user declined') ||
    msg.includes('rejected') ||
    msg.includes('denied') ||
    msg.includes('cancelled') ||
    msg.includes('canceled') ||
    msg.includes('user refused') ||
    msg.includes('user closed') ||
    msg.includes('modal closed')
  ) {
    return new TransactionRejectedError(error.message);
  }

  // Insufficient balance patterns
  if (
    msg.includes('insufficient') ||
    msg.includes('underfunded') ||
    msg.includes('not enough') ||
    msg.includes('op_underfunded') ||
    msg.includes('balance')
  ) {
    return new InsufficientBalanceError(error.message);
  }

  // Return original error if no match
  return error;
}

/**
 * Transaction status enum
 */
export const TX_STATUS = {
  IDLE: 'idle',
  BUILDING: 'building',
  SIGNING: 'signing',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  FAILED: 'failed',
};
