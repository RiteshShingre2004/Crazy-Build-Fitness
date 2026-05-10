import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Particle dot ──────────────────────────────────────────────────────────────
function Particle({ x, y, delay, size, opacity }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top:  `${y}%`,
        width:  size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(59,130,246,0.6)',
        boxShadow: '0 0 8px rgba(59,130,246,0.8)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, opacity, 0], scale: [0, 1, 0], y: [0, -40, -80] }}
      transition={{ duration: 2.2, delay, repeat: Infinity, repeatDelay: Math.random() * 2 }}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: 40 + Math.random() * 40,
  delay: Math.random() * 2,
  size: `${3 + Math.random() * 5}px`,
  opacity: 0.4 + Math.random() * 0.6,
}));

// ── Main splash screen ────────────────────────────────────────────────────────
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    // After logo animates in → hold → fade out → call onDone
    const holdTimer = setTimeout(() => setPhase('out'), 2400);
    const doneTimer = setTimeout(() => onDone(), 3100);
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'out' ? 0 : 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#050a14',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Grid background */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Ambient glow blobs */}
          <div style={{
            position: 'absolute', top: '20%', left: '30%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', right: '25%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />

          {/* Floating particles */}
          {PARTICLES.map(p => <Particle key={p.id} {...p} />)}

          {/* Central logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
          >
            {/* Icon */}
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(37,99,235,0.4)', '0 0 50px rgba(37,99,235,0.8)', '0 0 20px rgba(37,99,235,0.4)'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(59,130,246,0.4)',
              }}
            >
              {/* Lightning bolt SVG */}
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontSize: '2rem',
                fontWeight: 900,
                letterSpacing: '0.12em',
                background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}>
                CRAZY BUILD
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                style={{ fontSize: '0.78rem', color: '#334155', letterSpacing: '0.2em', marginTop: '0.4rem', fontWeight: 600 }}
              >
                LEVEL UP EVERY DAY
              </motion.div>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ width: 160 }}
            >
              <div style={{ height: 3, background: 'rgba(37,99,235,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.6, delay: 0.95, ease: 'easeInOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', borderRadius: 999 }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
