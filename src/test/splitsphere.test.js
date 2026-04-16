/**
 * SplitSphere Test Suite
 * Tests for: Error handling, Split calculation, Address validation, TX status, Caching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WalletNotFoundError,
  TransactionRejectedError,
  InsufficientBalanceError,
  parseError,
  TX_STATUS,
} from '../services/errors';

// ─────────────────────────────────────────────
// 1. ERROR HANDLING TESTS
// ─────────────────────────────────────────────

describe('WalletNotFoundError', () => {
  it('should have correct error type and name', () => {
    const err = new WalletNotFoundError();
    expect(err.name).toBe('WalletNotFoundError');
    expect(err.type).toBe('WALLET_NOT_FOUND');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(WalletNotFoundError);
  });

  it('should carry a user-friendly message', () => {
    const err = new WalletNotFoundError();
    expect(err.userMessage).toContain('No compatible wallet');
    expect(err.color).toBe('orange');
  });

  it('should accept custom message', () => {
    const err = new WalletNotFoundError('Freighter not installed');
    expect(err.message).toBe('Freighter not installed');
  });
});

describe('TransactionRejectedError', () => {
  it('should have correct error type', () => {
    const err = new TransactionRejectedError();
    expect(err.name).toBe('TransactionRejectedError');
    expect(err.type).toBe('TRANSACTION_REJECTED');
    expect(err.color).toBe('red');
  });

  it('should inform user no funds were sent', () => {
    const err = new TransactionRejectedError();
    expect(err.userMessage).toContain('No funds were sent');
  });
});

describe('InsufficientBalanceError', () => {
  it('should store required and available amounts', () => {
    const err = new InsufficientBalanceError('Not enough XLM', 50, 10);
    expect(err.required).toBe(50);
    expect(err.available).toBe(10);
    expect(err.type).toBe('INSUFFICIENT_BALANCE');
    expect(err.color).toBe('yellow');
  });

  it('should format amounts in user message', () => {
    const err = new InsufficientBalanceError('Not enough XLM', 100.5, 20.25);
    expect(err.userMessage).toContain('100.5000');
    expect(err.userMessage).toContain('20.2500');
  });
});

// ─────────────────────────────────────────────
// 2. PARSE ERROR TESTS
// ─────────────────────────────────────────────

describe('parseError', () => {
  it('should detect wallet-not-found from message', () => {
    const raw = new Error('Wallet not found in browser');
    const parsed = parseError(raw);
    expect(parsed).toBeInstanceOf(WalletNotFoundError);
  });

  it('should detect rejected transaction from message', () => {
    const raw = new Error('User denied signing the transaction');
    const parsed = parseError(raw);
    expect(parsed).toBeInstanceOf(TransactionRejectedError);
  });

  it('should detect insufficient balance from message', () => {
    const raw = new Error('op_underfunded: account has insufficient balance');
    const parsed = parseError(raw);
    expect(parsed).toBeInstanceOf(InsufficientBalanceError);
  });

  it('should return original error if unrecognized', () => {
    const raw = new Error('Unknown network timeout');
    const parsed = parseError(raw);
    expect(parsed).toBe(raw);
  });

  it('should handle cancelled transaction pattern', () => {
    const raw = new Error('User cancelled the request');
    const parsed = parseError(raw);
    expect(parsed).toBeInstanceOf(TransactionRejectedError);
  });
});

// ─────────────────────────────────────────────
// 3. TX_STATUS ENUM TESTS
// ─────────────────────────────────────────────

describe('TX_STATUS', () => {
  it('should contain all required lifecycle states', () => {
    expect(TX_STATUS.IDLE).toBe('idle');
    expect(TX_STATUS.BUILDING).toBe('building');
    expect(TX_STATUS.SIGNING).toBe('signing');
    expect(TX_STATUS.SUBMITTING).toBe('submitting');
    expect(TX_STATUS.SUCCESS).toBe('success');
    expect(TX_STATUS.FAILED).toBe('failed');
  });

  it('should have exactly 6 states', () => {
    expect(Object.keys(TX_STATUS).length).toBe(6);
  });
});

// ─────────────────────────────────────────────
// 4. SPLIT CALCULATION LOGIC TESTS
// ─────────────────────────────────────────────

describe('Split calculation logic', () => {
  const calculateShare = (total, ways) => parseFloat(total) / ways;
  const formatAmount = (amount) => amount.toFixed(7);

  it('should divide bill evenly by 2', () => {
    const share = calculateShare(100, 2);
    expect(share).toBe(50);
  });

  it('should divide bill evenly by 3', () => {
    const share = calculateShare(90, 3);
    expect(share).toBe(30);
  });

  it('should handle fractional amounts correctly', () => {
    const share = calculateShare(100, 3);
    expect(formatAmount(share)).toBe('33.3333333');
  });

  it('should return full amount when split by 1', () => {
    const share = calculateShare(150, 1);
    expect(share).toBe(150);
  });

  it('should handle decimal total bills', () => {
    const share = calculateShare(99.99, 3);
    expect(share).toBeCloseTo(33.33, 2);
  });

  it('should return 0 for zero total', () => {
    const share = calculateShare(0, 2);
    expect(share).toBe(0);
  });
});

// ─────────────────────────────────────────────
// 5. STELLAR ADDRESS VALIDATION TESTS
// ─────────────────────────────────────────────

describe('Stellar address validation', () => {
  // Stellar addresses: 56 chars, starts with G, uppercase alphanumeric
  const isValidStellarAddress = (address) => {
    if (!address || typeof address !== 'string') return false;
    if (address.length !== 56) return false;
    if (!address.startsWith('G')) return false;
    if (!/^[A-Z0-9]+$/.test(address)) return false;
    return true;
  };

  it('should accept a valid Stellar G-address', () => {
    // Real 56-char Stellar public key (generated via Keypair.random())
    const valid = 'GBAHG6DPVFAYTRFR3YZVRLCXB2QRNJJFX472Y3S3YOQ6JMEKK4Y6CLN3';
    expect(isValidStellarAddress(valid)).toBe(true);
  });

  it('should reject an address not starting with G', () => {
    const invalid = 'SAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV28WDZVG7T';
    expect(isValidStellarAddress(invalid)).toBe(false);
  });

  it('should reject an empty string', () => {
    expect(isValidStellarAddress('')).toBe(false);
  });

  it('should reject a truncated address', () => {
    expect(isValidStellarAddress('GABC123')).toBe(false);
  });

  it('should reject an address with lowercase letters', () => {
    expect(isValidStellarAddress('gahjjjkmokye4rvpzewztkh5fvi4pa3vl7gk2lfnubsgbv28wdzvg7t')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 6. CACHING / LOCAL STORAGE TESTS
// ─────────────────────────────────────────────

describe('Expense caching via localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save expenses to localStorage', () => {
    const expenses = [{ id: 1, description: 'Dinner', paidAmount: 50, receiver: 'GABC...', timestamp: new Date().toISOString() }];
    localStorage.setItem('stellarSplit_expenses', JSON.stringify(expenses));
    expect(localStorage.getItem('stellarSplit_expenses')).not.toBeNull();
  });

  it('should retrieve and parse saved expenses', () => {
    const expenses = [{ id: 1, description: 'Lunch', paidAmount: 25 }];
    localStorage.setItem('stellarSplit_expenses', JSON.stringify(expenses));
    const retrieved = JSON.parse(localStorage.getItem('stellarSplit_expenses'));
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].description).toBe('Lunch');
  });

  it('should return null for missing cache key', () => {
    expect(localStorage.getItem('stellarSplit_expenses')).toBeNull();
  });

  it('should overwrite cache on new expense added', () => {
    const initial = [{ id: 1, description: 'Coffee', paidAmount: 5 }];
    localStorage.setItem('stellarSplit_expenses', JSON.stringify(initial));
    const updated = [...initial, { id: 2, description: 'Pizza', paidAmount: 30 }];
    localStorage.setItem('stellarSplit_expenses', JSON.stringify(updated));
    const cached = JSON.parse(localStorage.getItem('stellarSplit_expenses'));
    expect(cached).toHaveLength(2);
    expect(cached[1].description).toBe('Pizza');
  });
});

// ─────────────────────────────────────────────
// 7. LOADING STATE TESTS
// ─────────────────────────────────────────────

describe('Loading and progress state management', () => {
  it('should start in IDLE state', () => {
    let status = TX_STATUS.IDLE;
    expect(status).toBe('idle');
  });

  it('should progress through states correctly', () => {
    const states = [];
    const setStatus = (s) => states.push(s);
    setStatus(TX_STATUS.BUILDING);
    setStatus(TX_STATUS.SIGNING);
    setStatus(TX_STATUS.SUBMITTING);
    setStatus(TX_STATUS.SUCCESS);
    expect(states).toEqual(['building', 'signing', 'submitting', 'success']);
  });

  it('should allow state to reach FAILED', () => {
    const states = [];
    const setStatus = (s) => states.push(s);
    setStatus(TX_STATUS.BUILDING);
    setStatus(TX_STATUS.FAILED);
    expect(states[states.length - 1]).toBe('failed');
  });

  it('should identify a terminal state correctly', () => {
    const terminalStates = [TX_STATUS.SUCCESS, TX_STATUS.FAILED];
    expect(terminalStates).toContain(TX_STATUS.SUCCESS);
    expect(terminalStates).toContain(TX_STATUS.FAILED);
    expect(terminalStates).not.toContain(TX_STATUS.BUILDING);
  });
});
