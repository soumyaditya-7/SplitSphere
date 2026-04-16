// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  Loader2,
  Check,
  X,
  Hammer,
  PenTool,
  Send,
  ExternalLink,
} from 'lucide-react';
import { TX_STATUS } from '../services/errors';
import { getExplorerLink } from '../services/stellar';

const STEPS = [
  { key: TX_STATUS.BUILDING, label: 'Building', icon: Hammer },
  { key: TX_STATUS.SIGNING, label: 'Signing', icon: PenTool },
  { key: TX_STATUS.SUBMITTING, label: 'Submitting', icon: Send },
];

function getStepState(currentStatus, stepKey) {
  const statusOrder = [TX_STATUS.BUILDING, TX_STATUS.SIGNING, TX_STATUS.SUBMITTING, TX_STATUS.SUCCESS];
  const currentIdx = statusOrder.indexOf(currentStatus);
  const stepIdx = statusOrder.indexOf(stepKey);

  if (currentStatus === TX_STATUS.FAILED) {
    // All steps up to and including the failed one get special treatment
    if (stepIdx < currentIdx || stepIdx === currentIdx) return 'failed';
    return 'pending';
  }

  if (currentStatus === TX_STATUS.SUCCESS) return 'complete';
  if (stepIdx < currentIdx) return 'complete';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export default function TransactionStatus({ status, txHash, error, onReset, label = 'Transaction' }) {
  if (status === TX_STATUS.IDLE) return null;

  const isTerminal = status === TX_STATUS.SUCCESS || status === TX_STATUS.FAILED;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl p-4 border ${
        status === TX_STATUS.SUCCESS
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : status === TX_STATUS.FAILED
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-dark-800 border-dark-600'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label} Status
        </span>
        {isTerminal && onReset && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Dismiss
          </motion.button>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-3">
        {STEPS.map((step, index) => {
          const state = getStepState(status, step.key);
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              {/* Step circle */}
              <motion.div
                animate={
                  state === 'active'
                    ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
                    : {}
                }
                transition={
                  state === 'active'
                    ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                    : {}
                }
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  state === 'complete'
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : state === 'active'
                    ? 'bg-emerald-500/10 border border-emerald-500/40'
                    : state === 'failed'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-dark-700 border border-dark-600'
                }`}
              >
                {state === 'complete' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : state === 'active' ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                ) : state === 'failed' ? (
                  <X className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5 text-gray-600" />
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  state === 'complete'
                    ? 'text-emerald-400'
                    : state === 'active'
                    ? 'text-emerald-300'
                    : state === 'failed'
                    ? 'text-red-400'
                    : 'text-gray-600'
                }`}
              >
                {step.label}
              </span>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 ${
                    state === 'complete'
                      ? 'bg-emerald-500/30'
                      : 'bg-dark-600'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Success result */}
      {status === TX_STATUS.SUCCESS && txHash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between pt-2 border-t border-emerald-500/10"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">
              Transaction confirmed!
            </span>
          </div>
          <a
            href={getExplorerLink(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-emerald-400/80 hover:text-emerald-300 transition-colors font-mono"
          >
            {txHash.slice(0, 8)}...{txHash.slice(-4)}
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      )}

      {/* Failure result */}
      {status === TX_STATUS.FAILED && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pt-2 border-t border-red-500/10"
        >
          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">
            {error || 'Transaction failed'}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
