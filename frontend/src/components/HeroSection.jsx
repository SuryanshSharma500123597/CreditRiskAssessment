import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Brain, Cpu } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stats = [
  { value: '307,511', label: 'Applications', icon: '📊' },
  { value: '4', label: 'ML Models', icon: '🤖' },
  { value: 'SHAP', label: 'Explainability', icon: '💡' },
  { value: 'CUDA', label: 'GPU-Accelerated', icon: '⚡' },
];

export default function HeroSection({ onAssess, onExplore }) {
  return (
    <section
      id="dashboard"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '7rem 1.5rem 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label="Dashboard hero section"
    >
      {/* Background glow effects */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800,
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '10%',
        width: 400, height: 400,
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: 860, textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.08)',
            marginBottom: '2rem',
          }}>
            <Brain size={14} color="#818cf8" />
            <span style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, letterSpacing: '0.05em' }}>
              ML Summer Internship Project 2026
            </span>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={itemVariants}
          style={{
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: '1.25rem',
            color: '#f1f5f9',
          }}
        >
          Credit Risk
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Assessment System
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          style={{
            fontSize: 18,
            color: '#94a3b8',
            fontWeight: 500,
            marginBottom: '0.75rem',
          }}
        >
          Machine Learning Based Loan Default Risk Prediction
        </motion.p>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          style={{
            fontSize: 16,
            color: '#64748b',
            maxWidth: 580,
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          Evaluate applicant risk using a trained machine learning model and understand
          the factors influencing each prediction.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            id="btn-assess-risk"
            onClick={onAssess}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)';
            }}
            aria-label="Navigate to risk assessment form"
          >
            Assess Credit Risk
            <ArrowRight size={16} />
          </button>

          <button
            id="btn-explore-model"
            onClick={onExplore}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px',
              borderRadius: 12,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#818cf8',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
            }}
            aria-label="Navigate to model insights"
          >
            <BarChart3 size={16} />
            Explore Model
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16,
            marginTop: 64,
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '20px 16px',
                borderRadius: 14,
                background: 'rgba(17,24,39,0.8)',
                border: '1px solid #1e293b',
                textAlign: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#f1f5f9',
                letterSpacing: '-0.03em',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pipeline visualization */}
        <motion.div variants={itemVariants} style={{ marginTop: 64 }}>
          <h2 style={{ fontSize: 14, color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 24, textTransform: 'uppercase' }}>
            Prediction Pipeline
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 0,
          }}>
            {['Applicant Data', 'Preprocessing', 'ML Model', 'Probability', 'Risk Category', 'SHAP Explanation'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: i === 2 ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.6)',
                  border: `1px solid ${i === 2 ? 'rgba(99,102,241,0.4)' : '#1e293b'}`,
                  fontSize: 12,
                  fontWeight: 500,
                  color: i === 2 ? '#818cf8' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}>
                  {step}
                </div>
                {i < 5 && (
                  <div style={{ color: '#2d3748', padding: '0 4px', fontSize: 14 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
