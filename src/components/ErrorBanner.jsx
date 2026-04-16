// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  XCircle,
  Coins,
  Wallet,
  X,
} from 'lucide-react';

const ICON_MAP = {
  WALLET_NOT_FOUND: Wallet,
  TRANSACTION_REJECTED: XCircle,
  INSUFFICIENT_BALANCE: Coins,
};

const COLOR_MAP = {
  WALLET_NOT_FOUND: {
    bg: 'rgba(251, 146, 60, 0.1)',
    border: 'rgba(251, 146, 60, 0.3)',
    text: '#fb923c',
    icon: '#fb923c',
  },
  TRANSACTION_REJECTED: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#ef4444',
    icon: '#ef4444',
  },
  INSUFFICIENT_BALANCE: {
    bg: 'rgba(234, 179, 8, 0.1)',
    border: 'rgba(234, 179, 8, 0.3)',
    text: '#eab308',
    icon: '#eab308',
  },
};

const DEFAULT_COLORS = {
  bg: 'rgba(239, 68, 68, 0.1)',
  border: 'rgba(239, 68, 68, 0.3)',
  text: '#ef4444',
  icon: '#ef4444',
};

export default function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  const errorType = error.type || 'UNKNOWN';
  const IconComponent = ICON_MAP[errorType] || AlertTriangle;
  const colors = COLOR_MAP[errorType] || DEFAULT_COLORS;
  const message = error.userMessage || error.message || 'An unexpected error occurred';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="rounded-2xl p-4 mb-4 overflow-hidden"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${colors.bg}` }}
          >
            <IconComponent
              className="w-5 h-5"
              style={{ color: colors.icon }}
            />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <h4
              className="font-semibold text-sm mb-0.5"
              style={{ color: colors.text }}
            >
              {errorType === 'WALLET_NOT_FOUND' && 'Wallet Not Found'}
              {errorType === 'TRANSACTION_REJECTED' && 'Transaction Rejected'}
              {errorType === 'INSUFFICIENT_BALANCE' && 'Insufficient Balance'}
              {!['WALLET_NOT_FOUND', 'TRANSACTION_REJECTED', 'INSUFFICIENT_BALANCE'].includes(errorType) && 'Error'}
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Dismiss */}
          {onDismiss && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
