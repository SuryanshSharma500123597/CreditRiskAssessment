import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Brain, Activity } from 'lucide-react';

const navLinks = [
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Risk Assessment', href: '#assessment' },
  { label: 'Model Insights', href: '#insights' },
  { label: 'About', href: '#about' },
];

export default function Navbar({ activePage, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (href, label) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(label);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s',
        backgroundColor: scrolled ? 'rgba(10,15,30,0.95)' : 'rgba(10,15,30,0.7)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #1e293b' : '1px solid transparent',
      }}
      role="banner"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo */}
          <button
            onClick={() => handleNav('#dashboard', 'Dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label="Go to Dashboard"
          >
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={20} color="white" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Credit Risk
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: -2 }}>
                Assessment System
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" style={{ display: 'flex', gap: 4 }} className="hidden-mobile">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href, link.label)}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                aria-current={activePage === link.label ? 'page' : undefined}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: activePage === link.label ? '#818cf8' : '#94a3b8',
                  backgroundColor: activePage === link.label ? 'rgba(99,102,241,0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (activePage !== link.label) e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={e => {
                  if (activePage !== link.label) e.currentTarget.style.color = '#94a3b8';
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden-mobile">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Live Model</span>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '8px',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'none',
            }}
            className="show-mobile"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              borderTop: '1px solid #1e293b',
              backgroundColor: 'rgba(10,15,30,0.98)',
              overflow: 'hidden',
            }}
          >
            <nav style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNav(link.href, link.label)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 500,
                    color: activePage === link.label ? '#818cf8' : '#94a3b8',
                    backgroundColor: activePage === link.label ? 'rgba(99,102,241,0.1)' : 'transparent',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}
