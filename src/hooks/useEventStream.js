/**
 * useEventStream — Green Belt: Advanced real-time event streaming
 * 
 * Polls the Stellar Horizon server for new transactions on a given address.
 * Emits events to the callback and maintains a live "activity feed".
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const POLL_INTERVAL_MS = 8000; // poll every 8 seconds

/**
 * @param {string|null} walletAddress - The connected wallet address to stream
 * @param {Function} onNewTransaction - Called with each new transaction object
 */
export function useEventStream(walletAddress, onNewTransaction) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [streamError, setStreamError] = useState(null);
  const intervalRef = useRef(null);
  const seenHashes = useRef(new Set());
  const onNewTransactionRef = useRef(onNewTransaction);

  // Keep callback ref fresh without restarting the stream
  useEffect(() => {
    onNewTransactionRef.current = onNewTransaction;
  }, [onNewTransaction]);

  const pollTransactions = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const server = new StellarSdk.Horizon.Server(HORIZON_URL);
      const txPage = await server
        .transactions()
        .forAccount(walletAddress)
        .order('desc')
        .limit(5)
        .call();

      const records = txPage.records || [];

      for (const tx of records) {
        if (!seenHashes.current.has(tx.hash)) {
          seenHashes.current.add(tx.hash);
          setLastTxHash(tx.hash);

          const parsed = {
            hash: tx.hash,
            ledger: tx.ledger,
            createdAt: tx.created_at,
            operationCount: tx.operation_count,
            successful: tx.successful,
          };

          onNewTransactionRef.current?.(parsed);
        }
      }

      setStreamError(null);
    } catch (err) {
      // Only set error if it's not a 404 (unfunded account)
      if (err?.response?.status !== 404) {
        setStreamError(err.message);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      clearInterval(intervalRef.current);
      return;
    }

    // Seed existing hashes on mount so we don't fire callbacks for old txs
    const seedExisting = async () => {
      try {
        const server = new StellarSdk.Horizon.Server(HORIZON_URL);
        const txPage = await server
          .transactions()
          .forAccount(walletAddress)
          .order('desc')
          .limit(10)
          .call();
        (txPage.records || []).forEach(tx => seenHashes.current.add(tx.hash));
      } catch {
        // ignore seed errors
      }
    };

    seedExisting().then(() => {
      setIsStreaming(true);
      intervalRef.current = setInterval(pollTransactions, POLL_INTERVAL_MS);
    });

    return () => {
      clearInterval(intervalRef.current);
      setIsStreaming(false);
    };
  }, [walletAddress, pollTransactions]);

  const stopStream = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsStreaming(false);
  }, []);

  return { isStreaming, lastTxHash, streamError, stopStream };
}
