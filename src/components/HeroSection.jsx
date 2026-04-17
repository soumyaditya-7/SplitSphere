// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, Shield, Coins, Users } from 'lucide-react';

/* ─── Animated floating orb ─────────────────────────────── */
function Orb({ className, delay = 0, duration = 8 }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[120px] opacity-20 pointer-events-none ${className}`}
      animate={{ y: [0, -30, 0], scale: [1, 1.08, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ─── Single particle dot ─────────────────────────────────── */
function Particle({ x, y, delay, duration }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ opacity: [0, 1, 0], y: [0, -20, -40], scale: [0, 1, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}

/* Deterministic particle positions to avoid hydration/re-render flicker */
const PARTICLES = [
  { x: 12, y: 35, delay: 0,   duration: 4.0 },
  { x: 22, y: 65, delay: 0.8, duration: 5.2 },
  { x: 38, y: 20, delay: 1.6, duration: 3.8 },
  { x: 55, y: 75, delay: 0.4, duration: 4.6 },
  { x: 68, y: 30, delay: 2.1, duration: 5.0 },
  { x: 80, y: 55, delay: 1.2, duration: 3.6 },
  { x: 90, y: 80, delay: 0.6, duration: 4.4 },
  { x: 5,  y: 85, delay: 1.9, duration: 5.5 },
  { x: 45, y: 50, delay: 2.8, duration: 4.1 },
  { x: 75, y: 15, delay: 0.2, duration: 3.9 },
  { x: 30, y: 90, delay: 3.2, duration: 4.8 },
  { x: 60, y: 10, delay: 2.5, duration: 5.1 },
];

export default function HeroSection({ onConnectClick }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[88vh] text-center px-4 overflow-hidden">

      {/* ── Background: Gradient glow orbs ── */}
      <Orb className="w-[600px] h-[600px] bg-emerald-500 -top-40 -left-40" delay={0} duration={9} />
      <Orb className="w-[500px] h-[500px] bg-emerald-700 -bottom-20 -right-32" delay={2} duration={11} />
      <Orb className="w-[300px] h-[300px] bg-teal-400 top-1/3 left-1/2 -translate-x-1/2" delay={1} duration={7} />

      {/* ── Background: Grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Background: Radial vignette to focus center ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, #030712 80%)',
        }}
      />

      {/* ── Background: Floating particles ── */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* ── Background: Horizontal scan line ── */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent pointer-events-none"
        animate={{ top: ['10%', '90%', '10%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />

      {/* ══════════════ CONTENT (on top of background) ══════════════ */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Floating badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium backdrop-blur-sm"
        >
          ⚡ Built on Stellar Testnet · Soroban Smart Contracts
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
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
          className="text-lg text-gray-400 max-w-lg mb-10 leading-relaxed"
        >
          Track shared expenses and settle debts instantly using XLM.{' '}
          No middlemen. No delays. Just split and pay.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(16,185,129,0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onConnectClick}
          className="flex items-center gap-3 px-10 py-5 rounded-[1.25rem] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-bold text-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/30 hover:border-emerald-300/60 relative"
        >
          {/* Button inner glow ripple */}
          <span className="absolute inset-0 rounded-[1.25rem] overflow-hidden">
            <motion.span
              className="absolute inset-0 bg-white/10 rounded-[1.25rem]"
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </span>
          <Wallet className="w-6 h-6 relative z-10" />
          <span className="relative z-10">Connect Wallet</span>
          <ArrowRight className="w-6 h-6 relative z-10" />
        </motion.button>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl w-full"
        >
          {[
            { icon: Shield, label: 'Multi-Wallet',    desc: 'Freighter, xBull, Albedo & more' },
            { icon: Coins,  label: 'Smart Contracts', desc: 'Soroban on-chain tracking' },
            { icon: Users,  label: 'Real-time',       desc: 'Live transaction status' },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.12 }}
              whileHover={{ scale: 1.04, borderColor: 'rgba(16,185,129,0.35)' }}
              className="glass-card rounded-xl p-5 text-center transition-all cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <feature.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white text-sm">{feature.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
