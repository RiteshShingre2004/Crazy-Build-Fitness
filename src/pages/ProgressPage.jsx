import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/useApp.js';
import { Plus, TrendingUp, Scale, Flame } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { SectionHeader } from '../components/UI.jsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs" style={{ border: '1px solid rgba(37,99,235,0.3)' }}>
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function ProgressPage() {
  const { state, logProgress } = useApp();
  const { progressLog, user } = state;

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    calories: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    logProgress({
      date: form.date,
      weight: Number(form.weight),
      calories: Number(form.calories),
      notes: form.notes,
    });
    setForm(f => ({ ...f, weight: '', calories: '', notes: '' }));
  };

  // Prepare chart data
  const chartData = [...progressLog].reverse().slice(0, 14).map(p => ({
    date: p.date,
    weight: p.weight || null,
    calories: p.calories || null,
  }));

  const weightLogs = progressLog.filter(p => p.weight > 0);
  const calorieAvg = progressLog.length
    ? Math.round(progressLog.reduce((s, p) => s + (p.calories || 0), 0) / progressLog.length)
    : 0;

  const startWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : user?.weight || 0;
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : user?.weight || 0;
  const weightChange = currentWeight - startWeight;

  return (
    <div className="page-container space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Progress Tracker</h2>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {progressLog.length} entries logged
          </p>
        </div>
      </motion.div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: Scale, label: 'Current Weight', value: `${currentWeight || user?.weight || '—'} kg`,
            color: '#3b82f6', sub: weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'Starting'
          },
          {
            icon: TrendingUp, label: 'Entries Logged', value: progressLog.length,
            color: '#10b981', sub: 'total logs'
          },
          {
            icon: Flame, label: 'Avg Calories', value: calorieAvg || '—',
            color: '#f59e0b', sub: 'kcal/day'
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <Icon size={15} style={{ color: s.color }} />
                </div>
                <p className="text-xs" style={{ color: '#64748b' }}>{s.label}</p>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs mt-1" style={{ color: s.color }}>{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Weight Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card">
          <SectionHeader title="Weight Trend" subtitle="Last 14 entries" />
          {chartData.some(d => d.weight) ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#3b82f6" strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Scale size={28} style={{ color: '#334155' }} className="mb-2" />
              <p className="text-sm" style={{ color: '#64748b' }}>Log your weight to see trends</p>
            </div>
          )}
        </motion.div>

        {/* Calorie Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card">
          <SectionHeader title="Calorie Intake" subtitle="Logged vs Target" />
          {chartData.some(d => d.calories) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="calories" name="Calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Flame size={28} style={{ color: '#334155' }} className="mb-2" />
              <p className="text-sm" style={{ color: '#64748b' }}>Log your calories to see trends</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Log Entry Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card">
        <SectionHeader title="Log Today's Progress" subtitle="Track your transformation" />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Date</label>
            <input type="date" className="input-field" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Weight (kg)</label>
            <input type="number" step="0.1" min="20" max="300" className="input-field"
              placeholder={`${user?.weight || '75'}`} value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Calories Eaten</label>
            <input type="number" min="0" max="10000" className="input-field"
              placeholder="1800" value={form.calories}
              onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
          </div>
          <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center justify-center gap-2 py-3">
            <Plus size={16} /> Log Entry
          </motion.button>
        </form>

        {/* Notes field */}
        <div className="mt-3">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#94a3b8' }}>Notes (optional)</label>
          <input className="input-field" placeholder="e.g. Did cardio, feeling strong..."
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </motion.div>

      {/* Log History */}
      {progressLog.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card">
          <SectionHeader title="Log History" subtitle={`${progressLog.length} entries`} />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progressLog.slice(0, 20).map((entry, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b text-sm"
                style={{ borderColor: 'rgba(37,99,235,0.08)' }}>
                <span style={{ color: '#64748b', width: '100px', flexShrink: 0 }}>{entry.date}</span>
                {entry.weight > 0 && <span style={{ color: '#3b82f6' }}>⚖️ {entry.weight}kg</span>}
                {entry.calories > 0 && <span style={{ color: '#f59e0b' }}>🔥 {entry.calories} kcal</span>}
                {entry.notes && <span className="truncate" style={{ color: '#475569', flex: 1 }}>{entry.notes}</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

