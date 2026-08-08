import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import RiskForm from '../components/RiskForm';
import RiskResult from '../components/RiskResult';
import { predictRisk } from '../services/api';

export default function AssessmentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await predictRisk(formData);
      setResult(response);
      // Scroll to result after a short delay
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      setError(err.message || 'Prediction failed. Please check the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="assessment" style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 6,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 12, color: '#818cf8', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Risk Assessment
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800, letterSpacing: '-0.03em',
            color: '#f1f5f9', marginBottom: 12,
          }}>
            Assess Applicant Risk
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, lineHeight: 1.7 }}>
            Enter applicant information to estimate the model-predicted probability of payment difficulty.
            Fields marked <span style={{ color: '#ef4444' }}>*</span> are required.
          </p>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              aria-live="assertive"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '16px 20px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                marginBottom: 24,
              }}
            >
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 2 }}>
                  Prediction Error
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{error}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form card */}
        <div style={{
          background: '#111827',
          border: '1px solid #1e293b',
          borderRadius: 16,
          padding: '32px',
          marginBottom: 32,
        }}>
          <RiskForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Result */}
        <div ref={resultRef}>
          <AnimatePresence mode="wait">
            {result && (
              <RiskResult result={result} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
