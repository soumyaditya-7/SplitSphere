import { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode2,
  ExternalLink,
  RefreshCw,
  Upload,
  Loader2,
  Check,
  Hash,
  Database,
  Activity,
} from 'lucide-react';
import { CONTRACT_ID, getContractExplorerLink, getExpenseCount, recordExpenseOnChain } from '../services/soroban';
import { truncateAddress } from '../services/stellar';
import { TX_STATUS } from '../services/errors';
import TransactionStatus from './TransactionStatus';

export default function ContractPanel({ walletAddress, signTransaction, expenses }) {
  const [onChainCount, setOnChainCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [recordingId, setRecordingId] = useState(null);
  const [txStatus, setTxStatus] = useState(TX_STATUS.IDLE);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [recordings, setRecordings] = useState(() => {
    const saved = localStorage.getItem('stellarSplit_recordings');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch on-chain expense count
  const fetchOnChainCount = useCallback(async () => {
    if (!walletAddress) return;
    setLoadingCount(true);
    try {
      const count = await getExpenseCount(walletAddress);
      setOnChainCount(Number(count));
    } catch (err) {
      console.error('Failed to fetch count:', err);
    } finally {
      setLoadingCount(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchOnChainCount();
  }, [fetchOnChainCount]);

  // Record an expense on-chain
  const handleRecordOnChain = useCallback(
    async (expense) => {
      if (!signTransaction) return;

      setRecordingId(expense.id);
      setTxStatus(TX_STATUS.IDLE);
      setTxHash(null);
      setTxError(null);

      try {
        const result = await recordExpenseOnChain(
          walletAddress,
          signTransaction,
          expense.description,
          { [expense.receiver]: expense.paidAmount },
          setTxStatus
        );

        setTxHash(result.hash);
        setTxStatus(TX_STATUS.SUCCESS);

        // Save recording
        const recording = {
          expenseId: expense.id,
          description: expense.description,
          txHash: result.hash,
          timestamp: new Date().toISOString(),
        };
        const updated = [recording, ...recordings];
        setRecordings(updated);
        localStorage.setItem('stellarSplit_recordings', JSON.stringify(updated));

        // Refresh count
        fetchOnChainCount();
      } catch (err) {
        setTxError(err.userMessage || err.message);
        setTxStatus(TX_STATUS.FAILED);
      } finally {
        setRecordingId(null);
      }
    },
    [walletAddress, signTransaction, recordings, fetchOnChainCount]
  );

  const isRecorded = (expenseId) =>
    recordings.some((r) => r.expenseId === expenseId);

  if (!walletAddress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-4"
    >
      {/* Contract Info Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileCode2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Smart Contract</h2>
          <span className="ml-auto px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            Soroban
          </span>
        </div>

        {/* Contract Address */}
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Contract Address</p>
              <p className="text-sm text-gray-300 font-mono">
                {truncateAddress(CONTRACT_ID)}
              </p>
            </div>
            <a
              href={getContractExplorerLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-400 transition-all text-xs"
            >
              Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* On-chain Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-800 rounded-xl p-3 border border-dark-700">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-gray-500">On-chain Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                {onChainCount !== null ? onChainCount : '—'}
              </span>
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                onClick={fetchOnChainCount}
                disabled={loadingCount}
                className="p-1 rounded-md hover:bg-dark-700 text-gray-600 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingCount ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          <div className="bg-dark-800 rounded-xl p-3 border border-dark-700">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-gray-500">Recorded Locally</span>
            </div>
            <span className="text-xl font-bold text-white">
              {recordings.length}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      {txStatus !== TX_STATUS.IDLE && (
        <TransactionStatus
          status={txStatus}
          txHash={txHash}
          error={txError}
          label="Contract Call"
          onReset={() => {
            setTxStatus(TX_STATUS.IDLE);
            setTxHash(null);
            setTxError(null);
          }}
        />
      )}

      {/* Record Expenses On-Chain */}
      {expenses && expenses.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Record On-Chain</h3>
          </div>

          <div className="space-y-2">
            {expenses.slice(0, 5).map((expense) => {
              const recorded = isRecorded(expense.id);
              const recording = recordingId === expense.id;

              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between bg-dark-800 rounded-xl p-3 border border-dark-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Paid {(expense.paidAmount || expense.totalAmount || 0).toFixed(2)} XLM to {(expense.receiver || expense.payer || 'Unknown Address').slice(0, 6)}...
                    </p>
                  </div>

                  {recorded ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                      <Check className="w-3 h-3" />
                      Recorded
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleRecordOnChain(expense)}
                      disabled={recording || recordingId !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all text-xs font-medium disabled:opacity-50 cursor-pointer"
                    >
                      {recording ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      {recording ? 'Recording...' : 'Record'}
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      {recordings.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              On-Chain Activity
            </h3>
          </div>

          <div className="space-y-2">
            {recordings.slice(0, 5).map((rec, i) => (
              <motion.div
                key={`${rec.txHash}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between bg-dark-800 rounded-xl p-3 border border-dark-700"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-sm text-gray-300">{rec.description}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(rec.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${rec.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors font-mono"
                >
                  <Hash className="w-3 h-3" />
                  {rec.txHash.slice(0, 6)}...
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
