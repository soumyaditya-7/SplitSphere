import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  Receipt,
  Trash2,
} from 'lucide-react';
import { sendPayment, truncateAddress, getExplorerLink } from '../services/stellar';
import toast from 'react-hot-toast';

export default function SettlementList({
  expenses,
  walletAddress,
  onSettled,
  onDeleteExpense,
  onRefreshBalance,
}) {
  const [settling, setSettling] = useState(null); // expense id being settled
  const [txResult, setTxResult] = useState(null);

  // Calculate debts from expenses
  const debts = [];
  expenses.forEach((expense) => {
    expense.participants.forEach((participant) => {
      if (!expense.settled?.[participant]) {
        debts.push({
          expenseId: expense.id,
          description: expense.description,
          from: participant,
          to: expense.payer,
          amount: expense.sharePerPerson,
          timestamp: expense.timestamp,
        });
      }
    });
  });

  // For the connected wallet: what others owe you, and what you owe others
  const owedToYou = debts.filter((d) => d.to === walletAddress);
  const youOwe = debts.filter((d) => d.from === walletAddress);

  const handleSettle = async (debt) => {
    const settleKey = `${debt.expenseId}-${debt.from}`;
    setSettling(settleKey);
    setTxResult(null);

    try {
      const result = await sendPayment(
        walletAddress,
        debt.to,
        debt.amount.toFixed(7),
        `Split: ${debt.description.slice(0, 20)}`
      );

      setTxResult({ ...result, settleKey });
      onSettled(debt.expenseId, walletAddress);
      onRefreshBalance();
      toast.success('Payment sent successfully!');
    } catch (err) {
      toast.error(err.message || 'Transaction failed');
      setTxResult({ success: false, error: err.message, settleKey });
    } finally {
      setSettling(null);
    }
  };

  if (!walletAddress || expenses.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6"
    >
      {/* Expenses List */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Receipt className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Expenses</h2>
          <span className="ml-auto text-sm text-gray-500">
            {expenses.length} total
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-dark-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{expense.description}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Paid by{' '}
                      <span className="text-emerald-400 font-mono">
                        {expense.payer === walletAddress
                          ? 'You'
                          : truncateAddress(expense.payer)}
                      </span>{' '}
                      · Split {expense.participants.length + 1} ways
                    </p>
                  </div>
                  <div className="text-right flex items-start gap-2">
                    <div>
                      <p className="text-lg font-bold text-white">
                        {expense.totalAmount.toFixed(2)} <span className="text-sm text-emerald-400">XLM</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(expense.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteExpense(expense.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* You Owe */}
      {youOwe.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">You Owe</h2>
          </div>

          <div className="space-y-3">
            {youOwe.map((debt) => {
              const settleKey = `${debt.expenseId}-${debt.from}`;
              const isSettling = settling === settleKey;
              const result =
                txResult?.settleKey === settleKey ? txResult : null;

              return (
                <motion.div
                  key={settleKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-dark-800 rounded-xl p-4 border border-dark-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">You</span>
                        <ArrowRight className="w-4 h-4 text-orange-400" />
                        <span className="text-gray-300 font-mono truncate">
                          {truncateAddress(debt.to)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-orange-400">
                        {debt.amount.toFixed(4)} XLM
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSettle(debt)}
                        disabled={isSettling}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-semibold text-xs transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400/30 hover:border-emerald-300/60 disabled:opacity-50 cursor-pointer"
                      >
                        {isSettling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        {isSettling ? 'Sending...' : 'Pay'}
                      </motion.button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-2">
                    For: {debt.description}
                  </p>

                  {/* Transaction Result */}
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 p-3 rounded-lg text-sm ${
                        result.success
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`}
                    >
                      {result.success ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>Transaction successful!</span>
                          </div>
                          <a
                            href={getExplorerLink(result.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
                          >
                            <span className="font-mono text-xs">
                              {result.hash.slice(0, 8)}...
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{result.error || 'Transaction failed'}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owed to You */}
      {owedToYou.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Owed to You</h2>
          </div>

          <div className="space-y-3">
            {owedToYou.map((debt) => {
              const key = `${debt.expenseId}-${debt.from}`;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-dark-800 rounded-xl p-4 border border-dark-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-300 font-mono">
                        {truncateAddress(debt.from)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <span className="text-gray-400">You</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-emerald-400">
                        {debt.amount.toFixed(4)} XLM
                      </span>
                      <span className="text-xs text-gray-600 bg-dark-700 px-2 py-1 rounded-md">
                        Pending
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    For: {debt.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* No debts state */}
      {debts.length === 0 && expenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">All Settled!</h3>
          <p className="text-sm text-gray-500">No pending debts. You're all clear.</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function TrendingUpIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
