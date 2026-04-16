// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2, Check } from 'lucide-react';

const WALLETS = [
  {
    id: 'freighter',
    name: 'Freighter',
    icon: '🚀',
    description: 'Browser extension wallet',
    url: 'https://www.freighter.app/',
    color: '#6366f1',
  },
  {
    id: 'xbull',
    name: 'xBull',
    icon: '🐂',
    description: 'Web & extension wallet',
    url: 'https://xbull.app/',
    color: '#f59e0b',
  },
  {
    id: 'albedo',
    name: 'Albedo',
    icon: '🌟',
    description: 'Web-based signer',
    url: 'https://albedo.link/',
    color: '#3b82f6',
  },
  {
    id: 'lobstr',
    name: 'LOBSTR',
    icon: '🦞',
    description: 'Mobile & web wallet',
    url: 'https://lobstr.co/',
    color: '#10b981',
  },
  {
    id: 'hana',
    name: 'Hana',
    icon: '🌸',
    description: 'Wallet extension',
    url: 'https://hanawallet.io/',
    color: '#ec4899',
  },
  {
    id: 'rabet',
    name: 'Rabet',
    icon: '🔷',
    description: 'Browser extension',
    url: 'https://rabet.io/',
    color: '#8b5cf6',
  },
];

export default function WalletModal({ isOpen, onClose, onSelectWallet, connecting, connectedWallet }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-emerald-500/20 shadow-[0_0_60px_rgba(16,185,129,0.1)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose a Stellar wallet to connect
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-dark-700 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Wallet List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {WALLETS.map((wallet, index) => {
                  const isConnecting = connecting === wallet.id;
                  const isConnected = connectedWallet === wallet.id;

                  return (
                    <motion.button
                      key={wallet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectWallet(wallet.id)}
                      disabled={isConnecting || isConnected}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-800 border border-dark-600 hover:border-emerald-500/30 hover:bg-dark-700 hover:shadow-[0_0_15px_rgba(16,185,129,0.08)] transition-all duration-300 cursor-pointer disabled:opacity-60 group"
                    >
                      {/* Wallet Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{
                          background: `${wallet.color}15`,
                          border: `1px solid ${wallet.color}30`,
                        }}
                      >
                        {wallet.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors">
                          {wallet.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {wallet.description}
                        </p>
                      </div>

                      {/* Status */}
                      {isConnecting ? (
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      ) : isConnected ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-dark-500 group-hover:bg-emerald-400 transition-colors" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="mt-5 pt-4 border-t border-dark-700">
                <p className="text-xs text-gray-600 text-center">
                  Don't have a wallet?{' '}
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400/80 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                  >
                    Get Freighter
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
