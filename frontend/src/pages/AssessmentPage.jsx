import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw } from 'lucide-react';
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
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      console.error('[Assessment Error]', err);
      if (err.message && err.message.includes('Cannot connect')) {
        setError('The risk assessment backend service is temporarily offline. Please ensure the FastAPI server is running on port 8000 and try again.');
      } else {
        setError('Unable to generate the credit risk assessment. Please verify the applicant information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="assessment" style={{ maxWidth: 960, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 6,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            fontSize: 12, color: '#818cf8', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Risk Assessment Engine
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800, letterSpacing: '-0.03em',
            color: '#f1f5f9', marginBottom: 12,
          }}>
            Credit Risk Assessment Application
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 640, lineHeight: 1.7, margin: 0 }}>
            Submit applicant profile metrics to generate a model-estimated probability of payment difficulty, risk level classification, and SHAP explainability breakdown.
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
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: 16, padding: '18px 24px', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                marginBottom: 28,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
                    Assessment Service Notice
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{error}</div>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 6, color: '#fca5a5', padding: '6px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RotateCcw size={12} /> Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <RiskForm onSubmit={handleSubmit} loading={loading} />

        {/* Result */}
        <div ref={resultRef} style={{ marginTop: result ? 40 : 0 }}>
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
