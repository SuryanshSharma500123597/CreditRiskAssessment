import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AssessmentPage from './pages/AssessmentPage';
import InsightsPage from './pages/InsightsPage';
import AboutPage from './pages/AboutPage';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const pageTransition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #1e293b',
      padding: '24px 1.5rem',
      marginTop: 'auto',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
          Credit Risk Assessment System — Summer Internship Project 2026 ·{' '}
          <span style={{ color: '#64748b' }}>
            Built with FastAPI + XGBoost + SHAP + React
          </span>
        </p>
        <p style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>
          ⚠️ Demonstration only — not a production credit scoring system
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const contentRef = useRef(null);

  const pages = {
    Dashboard: null, // Rendered inline with HeroSection
    'Risk Assessment': <AssessmentPage />,
    'Model Insights': <InsightsPage />,
    About: <AboutPage />,
  };

  const navigate = (page) => {
    setActivePage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activePage={activePage}
        onNavigate={navigate}
      />

      <main
        ref={contentRef}
        style={{ flex: 1, paddingTop: 64 }}
        id="main-content"
        role="main"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            style={{ minHeight: 'calc(100vh - 64px)' }}
          >
            {activePage === 'Dashboard' ? (
              <HeroSection
                onAssess={() => navigate('Risk Assessment')}
                onExplore={() => navigate('Model Insights')}
              />
            ) : (
              <div style={{ paddingTop: '3rem' }}>
                {pages[activePage]}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
