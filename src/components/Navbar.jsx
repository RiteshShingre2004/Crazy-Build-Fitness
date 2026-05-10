import { motion } from 'framer-motion';
import { Bell, Search, Settings } from 'lucide-react';
import { useApp } from '../context/useApp.js';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  diet: 'Diet Plan',
  workouts: 'Workouts',
  progress: 'Progress',
  profile: 'Profile',
};

const PAGE_SUBTITLES = {
  dashboard: 'Your daily overview',
  diet: '30-Day Personalized Meal Plan',
  workouts: 'Weekly Training Split',
  progress: 'Track your transformation',
  profile: 'Your fitness profile',
};

export default function Navbar({ activePage, onNavigate }) {
  const { state } = useApp();
  const user = state.user;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 right-0 left-64 z-20 h-16 flex items-center justify-between px-6"
      style={{
        background: 'rgba(5, 10, 20, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(37,99,235,0.12)',
      }}
    >
      {/* Left: Page title */}
      <div>
        <h2 className="text-lg font-bold text-white leading-tight">
          {PAGE_TITLES[activePage]}
        </h2>
        <p className="text-xs" style={{ color: '#64748b' }}>
          {PAGE_SUBTITLES[activePage]}
        </p>
      </div>

      {/* Right: Date + actions */}
      <div className="flex items-center gap-4">
        <span className="text-xs hidden md:block" style={{ color: '#475569' }}>{today}</span>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center relative"
            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)' }}
            onClick={() => onNavigate('progress')}
          >
            <Bell size={15} style={{ color: '#60a5fa' }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: '#3b82f6' }} />
          </motion.button>

          {/* Profile avatar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #6366f1)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

