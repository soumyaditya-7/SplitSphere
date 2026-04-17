// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

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

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
    </div>
  );
}
