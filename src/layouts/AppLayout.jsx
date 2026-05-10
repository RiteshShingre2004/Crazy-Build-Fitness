import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

export default function AppLayout({ activePage, onNavigate, children }) {
  return (
    <div className="min-h-screen" style={{ background: '#050a14' }}>
      {/* Animated background */}
      <div className="animated-bg grid-bg" />

      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      {/* Main content area */}
      <div style={{ marginLeft: '256px', paddingTop: '64px' }}>
        {/* Navbar */}
        <Navbar activePage={activePage} onNavigate={onNavigate} />

        {/* Page content with animation */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activePage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
