import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, Copy, ExternalLink } from 'lucide-react';
import { fetchBalance, truncateAddress } from '../services/stellar';
import toast from 'react-hot-toast';

export default function BalanceCard({ walletAddress }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const bal = await fetchBalance(walletAddress);
      setBalance(bal);
    } catch (err) {
      toast.error('Failed to fetch balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success('Address copied!');
  };

  if (!walletAddress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card glass-card-hover rounded-2xl p-6 glow-green"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Your Balance
          </h2>
        </div>
        <motion.button
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.4 }}
          onClick={loadBalance}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-dark-700 text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Balance */}
      <div className="mb-4">
        {balance !== null ? (
          <motion.div
            key={balance}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <span className="text-4xl font-bold text-white tracking-tight">
              {balance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            </span>
            <span className="text-lg font-medium text-emerald-400 ml-2">XLM</span>
          </motion.div>
        ) : (
          <div className="h-10 w-48 bg-dark-700 rounded-lg animate-pulse" />
        )}
      </div>

      {/* Address */}
      <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
        <div className="flex-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
          <span className="text-sm text-gray-500 font-mono">
            {truncateAddress(walletAddress)}
          </span>
        </div>
        <button
          onClick={copyAddress}
          className="p-1.5 rounded-md hover:bg-dark-700 text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
          title="Copy address"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md hover:bg-dark-700 text-gray-600 hover:text-gray-300 transition-colors"
          title="View on explorer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.div>
  );
}
