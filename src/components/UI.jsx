import { motion } from 'framer-motion';

// ─── Macro Progress Bar ───────────────────────────────────────────────────────
export function MacroBar({ label, value, total, color, unit = 'g' }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: '#94a3b8' }}>{label}</span>
        <span style={{ color }}>{value}{unit}</span>
      </div>
      <div className="macro-bar">
        <motion.div
          className="macro-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = '#3b82f6', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
          {sub}
        </span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
    </motion.div>
  );
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────
export function CircularProgress({ pct, size = 100, strokeWidth = 8, color = '#3b82f6', label, value }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id={`ringGrad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={`url(#ringGrad-${label})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-white">{value}</span>
          <span className="text-xs" style={{ color: '#64748b' }}>{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{label}</span>
    </div>
  );
}

// ─── Tag Badge ────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'rgba(37,99,235,0.15)',   text: '#60a5fa',  border: 'rgba(37,99,235,0.3)' },
    green:  { bg: 'rgba(16,185,129,0.15)',  text: '#34d399',  border: 'rgba(16,185,129,0.3)' },
    orange: { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24',  border: 'rgba(245,158,11,0.3)' },
    red:    { bg: 'rgba(239,68,68,0.15)',   text: '#f87171',  border: 'rgba(239,68,68,0.3)' },
    purple: { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa',  border: 'rgba(139,92,246,0.3)' },
    cyan:   { bg: 'rgba(6,182,212,0.15)',   text: '#22d3ee',  border: 'rgba(6,182,212,0.3)' },
  };
  const c = colors[color] || colors.blue;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' }}>
        <Icon size={28} style={{ color: '#3b82f6' }} />
      </div>
      <div>
        <p className="font-semibold text-white mb-1">{title}</p>
        <p className="text-sm" style={{ color: '#64748b' }}>{description}</p>
      </div>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full border-2 border-transparent"
        style={{ borderTopColor: '#3b82f6', borderRightColor: '#3b82f6' + '40' }}
      />
    </div>
  );
}
