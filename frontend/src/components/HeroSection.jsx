import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, ShieldCheck, Cpu, Database, Activity } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stats = [
  { value: '307,511', label: 'Evaluated Dataset Records', icon: Database },
  { value: '149', label: 'Feature Metrics', icon: Activity },
  { value: 'SHAP', label: 'Explainability Engine', icon: ShieldCheck },
  { value: 'CUDA', label: 'NVIDIA GPU Accelerated', icon: Cpu },
];

export default function HeroSection({ onAssess, onExplore }) {
  return (
    <section
      id="dashboard"
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '5rem 1.5rem 4rem',
        position: 'relative',
      }}
      aria-label="Credit Risk Assessment Dashboard"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ textAlign: 'center' }}
      >
        {/* Enterprise Badge */}
        <motion.div variants={itemVariants}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.25)',
            background: 'rgba(99,102,241,0.08)',
            marginBottom: '1.75rem',
          }}>
            <ShieldCheck size={14} color="#818cf8" />
            <span style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Enterprise Credit Risk Analytics Engine
            </span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          variants={itemVariants}
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            marginBottom: '1.25rem',
            color: '#f1f5f9',
          }}
        >
          Credit Risk
          <span style={{
            display: 'block',
            color: '#818cf8',
            marginTop: 4,
          }}>
            Assessment System
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: '#94a3b8',
            maxWidth: 640,
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          Evaluate applicant credit risk using machine learning.
          Generate real-time probability estimates, data-driven risk categories, and SHAP feature explanations.
        </motion.p>

        {/* Primary & Secondary CTAs */}
        <motion.div
          variants={itemVariants}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            id="btn-assess-risk"
            onClick={onAssess}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '16px 32px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)';
            }}
            aria-label="Navigate to risk assessment form"
          >
            Assess Credit Risk
            <ArrowRight size={18} />
          </button>

          <button
            id="btn-explore-model"
            onClick={onExplore}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '16px 28px',
              borderRadius: 12,
              background: '#111827',
              border: '1px solid #1e293b',
              color: '#f1f5f9',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#818cf8';
              e.currentTarget.style.background = '#1a2332';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#1e293b';
              e.currentTarget.style.background = '#111827';
            }}
            aria-label="Navigate to model insights"
          >
            <BarChart3 size={18} color="#818cf8" />
            Explore Model Insights
          </button>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div
          variants={itemVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginTop: 56,
          }}
        >
          {stats.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  padding: '24px 20px',
                  borderRadius: 14,
                  background: '#111827',
                  border: '1px solid #1e293b',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stat.label}
                  </span>
                  <StatIcon size={18} color="#818cf8" />
                </div>
                <div style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#f1f5f9',
                  letterSpacing: '-0.03em',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Pipeline Architecture Diagram */}
        <motion.div variants={itemVariants} style={{ marginTop: 56 }}>
          <div style={{
            background: '#111827',
            border: '1px solid #1e293b',
            borderRadius: 16,
            padding: '28px 32px',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                  End-to-End Prediction Architecture
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                  Standardized flow from applicant payload to SHAP risk explanation
                </p>
              </div>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                Active Pipeline
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
            }}>
              {[
                { step: '1. Applicant Data', desc: 'Raw financial metrics' },
                { step: '2. Preprocessing', desc: 'One-hot & feature scaling' },
                { step: '3. Tuned XGBoost', desc: 'Weighted classification' },
                { step: '4. Probability', desc: 'Calibrated score' },
                { step: '5. Risk Category', desc: 'LOW / MEDIUM / HIGH' },
                { step: '6. SHAP Factors', desc: 'Feature explanations' },
              ].map((item, idx) => (
                <div key={item.step} style={{
                  padding: '14px',
                  borderRadius: 10,
                  background: idx === 2 ? 'rgba(99,102,241,0.12)' : '#1a2332',
                  border: `1px solid ${idx === 2 ? 'rgba(99,102,241,0.35)' : '#1e293b'}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: idx === 2 ? '#818cf8' : '#e2e8f0', marginBottom: 4 }}>
                    {item.step}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
