import { motion } from 'framer-motion';
import { Wallet, Zap, ArrowRight, Shield, Coins, Users } from 'lucide-react';

export default function HeroSection({ onConnectClick }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
    >
      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium"
      >
        ⚡ Built on Stellar Testnet
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
      >
        Split Bills.
        <br />
        <span className="text-gradient">Settle On-Chain.</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-gray-500 max-w-lg mb-10 leading-relaxed"
      >
        Track shared expenses and settle debts instantly using XLM. 
        No middlemen. No delays. Just split and pay.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onConnectClick}
        className="flex items-center gap-3 px-10 py-5 rounded-[1.25rem] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-bold text-xl transition-all glow-green-strong cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-400/30 hover:border-emerald-300/60"
      >
        <Wallet className="w-6 h-6" />
        Connect Freighter
        <ArrowRight className="w-6 h-6" />
      </motion.button>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-32 max-w-3xl w-full"
      >
        {[
          {
            icon: Shield,
            label: 'Secure',
            desc: 'Freighter wallet signing',
          },
          {
            icon: Coins,
            label: 'Fast',
            desc: '5-second settlements',
          },
          {
            icon: Users,
            label: 'Simple',
            desc: 'Split with public keys',
          },
        ].map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <feature.icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white text-sm">{feature.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
