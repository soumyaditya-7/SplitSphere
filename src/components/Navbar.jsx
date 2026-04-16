import { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  LogOut,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  connectWalletById,
  getPublicKey,
  truncateAddress,
} from '../services/stellar';
import { WalletNotFoundError, TransactionRejectedError } from '../services/errors';
import WalletModal from './WalletModal';
import ErrorBanner from './ErrorBanner';
import toast from 'react-hot-toast';

const WALLET_LABELS = {
  freighter: '🚀 Freighter',
  xbull: '🐂 xBull',
  albedo: '🌟 Albedo',
  lobstr: '🦞 LOBSTR',
  hana: '🌸 Hana',
  rabet: '🔷 Rabet',
};

export default function Navbar({ walletAddress, setWalletAddress, connectedWallet, setConnectedWallet }) {
  const [connecting, setConnecting] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Auto-reconnect on page load
  useEffect(() => {
    const savedWallet = localStorage.getItem('stellarSplit_wallet');
    const savedWalletId = localStorage.getItem('stellarSplit_walletId');
    if (savedWallet && savedWalletId) {
      // Try to reconnect silently
      getPublicKey()
        .then((key) => {
          setWalletAddress(key);
          setConnectedWallet(savedWalletId);
        })
        .catch(() => {
          localStorage.removeItem('stellarSplit_wallet');
          localStorage.removeItem('stellarSplit_walletId');
        });
    }
  }, [setWalletAddress, setConnectedWallet]);

  const handleSelectWallet = useCallback(async (walletId) => {
    setConnecting(walletId);

    try {
      const { address, walletId: connectedId } = await connectWalletById(walletId);
      setWalletAddress(address);
      setConnectedWallet(connectedId);
      localStorage.setItem('stellarSplit_wallet', address);
      localStorage.setItem('stellarSplit_walletId', connectedId);
      toast.success(`Connected via ${WALLET_LABELS[connectedId] || connectedId}!`);
      setModalOpen(false);
    } catch (err) {
      if (err instanceof WalletNotFoundError) {
        toast.error(err.userMessage);
      } else if (err instanceof TransactionRejectedError) {
        toast.error('Connection was rejected');
      } else {
        toast.error(err.message || 'Failed to connect wallet');
      }
    } finally {
      setConnecting(null);
    }
  }, [setWalletAddress, setConnectedWallet]);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    setConnectedWallet(null);
    localStorage.removeItem('stellarSplit_wallet');
    localStorage.removeItem('stellarSplit_walletId');
    toast.success('Wallet disconnected');
  }, [setWalletAddress, setConnectedWallet]);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full sticky top-0 z-50 glass-card border-b border-emerald-500/10"
      >
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center glow-green">
              <Zap className="w-5 h-5 text-dark-950" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Stellar<span className="text-gradient">Split</span>
            </span>
          </motion.div>

          {/* Wallet Button */}
          <AnimatePresence mode="wait">
            {walletAddress ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3"
              >
                {/* Wallet type badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
                  <span className="text-xs text-emerald-400/80 font-medium">
                    {WALLET_LABELS[connectedWallet] || 'Wallet'}
                  </span>
                  <span className="text-sm text-emerald-400 font-medium font-mono">
                    {truncateAddress(walletAddress)}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-800 border border-dark-600 hover:border-red-500/50 hover:bg-dark-700 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] text-gray-400 hover:text-red-400 transition-all duration-300 text-sm font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="disconnected"
                data-connect-wallet="true"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-semibold text-base transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400/30 hover:border-emerald-300/60 cursor-pointer"
              >
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Wallet Selection Modal */}
      <WalletModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        onSelectWallet={handleSelectWallet}
        connecting={connecting}
        connectedWallet={connectedWallet}
      />
    </>
  );
}
