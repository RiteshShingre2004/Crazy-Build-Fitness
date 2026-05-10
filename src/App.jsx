import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import { useApp } from './context/useApp.js';
import AppLayout from './layouts/AppLayout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DietPage from './pages/DietPage.jsx';
import WorkoutsPage from './pages/WorkoutsPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import { useHealthData } from './hooks/useHealthData.js';
import { App as CapacitorApp } from '@capacitor/app';
import { motion } from 'framer-motion';

const PAGES = {
  dashboard: DashboardPage,
  diet:      DietPage,
  workouts:  WorkoutsPage,
  progress:  ProgressPage,
  profile:   ProfilePage,
};

function AppContent() {
  const { state, trackPageVisit } = useApp();
  const [activePage, setActivePage] = useState('dashboard');
  const { syncHealthData, healthData } = useHealthData();

  // ── Auto activity tracking ──────────────────────────────────────────────
  // Fires on every page navigation — marks appVisited: true for today.
  // workoutDone / mealsLogged are set explicitly via "Mark Done" buttons
  // inside WorkoutsPage and DietPage respectively.
  useEffect(() => {
    if (state.isAuthenticated) {
      trackPageVisit(activePage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, state.isAuthenticated]);

  useEffect(() => {
    if (state.isAuthenticated) {
      syncHealthData(); // Sync on load
      
      const appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) syncHealthData(); // Sync on foreground
      });

      // Setup 15 min interval
      const interval = setInterval(syncHealthData, 15 * 60 * 1000);
      
      return () => {
        clearInterval(interval);
        appStateListener.then(listener => listener.remove());
      };
    }
  }, [state.isAuthenticated, syncHealthData]);

  if (state.isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 grid-bg">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <AuthPage />;
  }

  const PageComponent = PAGES[activePage] || DashboardPage;

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      <PageComponent onNavigate={setActivePage} healthData={healthData} />
    </AppLayout>
  );
}

export default function App() {
  // Show splash once per session (not on every hot-reload)
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem('splashShown') === '1'
  );

  const handleSplashDone = () => {
    sessionStorage.setItem('splashShown', '1');
    setSplashDone(true);
  };

  return (
    <AppProvider>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      {splashDone && <AppContent />}
    </AppProvider>
  );
}
