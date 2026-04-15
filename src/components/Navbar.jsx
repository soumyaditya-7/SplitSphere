import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  LogOut,
  Loader2,
  Zap,
} from 'lucide-react';
import {
  connectWallet,
  getPublicKey,
  isFreighterInstalled,
  truncateAddress,
} from '../services/stellar';
import toast from 'react-hot-toast';

export default function Navbar({ walletAddress, setWalletAddress }) {
  const [connecting, setConnecting] = useState(false);
  const [installed, setInstalled] = useState(null);

  useEffect(() => {
    isFreighterInstalled().then(setInstalled);
  }, []);

  // Auto-reconnect on page load
  useEffect(() => {
    const saved = localStorage.getItem('stellarSplit_wallet');
    if (saved) {
      getPublicKey()
        .then((key) => {
          setWalletAddress(key);
        })
        .catch(() => {
          localStorage.removeItem('stellarSplit_wallet');
        });
    }
  }, [setWalletAddress]);

  const handleConnect = useCallback(async () => {
    if (!installed) {
      toast.error('Freighter wallet not detected. Please install it first.');
      window.open('https://www.freighter.app/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      const pubKey = await connectWallet();
      setWalletAddress(pubKey);
      localStorage.setItem('stellarSplit_wallet', pubKey);
      toast.success('Wallet connected!');
    } catch (err) {
      toast.error(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, [installed, setWalletAddress]);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    localStorage.removeItem('stellarSplit_wallet');
    toast.success('Wallet disconnected');
  }, [setWalletAddress]);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 glass-card border-b border-emerald-500/10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
                <span className="text-sm text-emerald-400 font-medium">
                  {truncateAddress(walletAddress)}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 border border-dark-600 hover:border-red-500/40 text-gray-400 hover:text-red-400 transition-all duration-300 text-sm font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="disconnected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-semibold text-sm transition-all duration-300 glow-green disabled:opacity-50 cursor-pointer"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
