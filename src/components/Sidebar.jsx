import { motion } from 'framer-motion';
import { useApp } from '../context/useApp.js';
import {
  LayoutDashboard, Utensils, Dumbbell, TrendingUp, User,
  LogOut, Zap, ChevronRight
} from 'lucide-react';
import { getStreakCount } from '../engines/activityEngine.js';

const navItems = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'diet',      label: 'Diet Plan',  icon: Utensils },
  { id: 'workouts',  label: 'Workouts',   icon: Dumbbell },
  { id: 'progress',  label: 'Progress',   icon: TrendingUp },
  { id: 'profile',   label: 'Profile',    icon: User },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { state, logout } = useApp();
  const user   = state.user;
  const streak = getStreakCount(state.activityLog || []);

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed left-0 top-0 bottom-0 w-64 z-30 flex flex-col"
      style={{
        background: 'rgba(5, 10, 20, 0.97)',
        borderRight: '1px solid rgba(37,99,235,0.15)',
      }}
    >
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
              <Zap size={20} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl"
              style={{ boxShadow: '0 0 16px rgba(59,130,246,0.5)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Crazy Build</h1>
            <p className="text-xs" style={{ color: '#3b82f6' }}>Fitness Engine</p>
          </div>
        </div>
      </div>

      {/* User pill */}
      {user && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #6366f1)' }}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name || 'Athlete'}</p>
              <p className="text-xs" style={{ color: '#60a5fa' }}>{user.goal?.replace(/_/g, ' ') || 'Goal'}</p>
            </div>
            {/* Streak badge */}
            {streak > 0 && (
              <motion.div
                animate={streak >= 3 ? { scale: [1, 1.12, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  background: 'rgba(249,115,22,0.15)',
                  border: '1px solid rgba(249,115,22,0.35)',
                  color: '#fb923c',
                }}
                title={`${streak}-day streak`}
              >
                🔥 {streak}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-link w-full text-left ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} style={{ color: '#3b82f6' }} />}
            </motion.button>
          );
        })}
      </nav>

      {/* Goal badge */}
      {user && (
        <div className="px-4 py-3">
          <div className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <p className="text-xs mb-1" style={{ color: '#64748b' }}>Current Goal</p>
            <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>
              {user.goal === 'muscle_gain' ? '💪 Muscle Gain'
               : user.goal === 'fat_loss' ? '🔥 Fat Loss'
               : '⚖️ Maintenance'}
            </p>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 pt-0">
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="sidebar-link w-full text-left"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}

