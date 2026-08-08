import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, MinusCircle } from 'lucide-react';
import RiskMeter from './RiskMeter';
import ShapExplanation from './ShapExplanation';

export default function RiskResult({ result }) {
  if (!result) return null;

  const { predicted_class, probability, risk_category, model, shap } = result;
  const pct = (probability * 100).toFixed(1);

  const riskColor = risk_category === 'HIGH' ? '#ef4444'
    : risk_category === 'MEDIUM' ? '#f59e0b'
    : '#10b981';

  const riskBg = risk_category === 'HIGH' ? 'rgba(239,68,68,0.05)'
    : risk_category === 'MEDIUM' ? 'rgba(245,158,11,0.05)'
    : 'rgba(16,185,129,0.05)';

  const RiskIcon = risk_category === 'HIGH' ? AlertTriangle
    : risk_category === 'MEDIUM' ? MinusCircle
    : CheckCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Main result card */}
      <div style={{
        border: `1px solid ${riskColor}30`,
        borderRadius: 16,
        background: riskBg,
        padding: '28px 32px',
        marginBottom: 24,
      }}
        role="region"
        aria-label="Credit risk assessment result"
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Credit Risk Result
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RiskIcon size={24} color={riskColor} aria-hidden="true" />
              <span style={{ fontSize: 26, fontWeight: 800, color: riskColor }}>
                {risk_category} RISK
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 48,
              fontWeight: 900,
              color: riskColor,
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              {pct}%
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Model-predicted probability of payment difficulty
            </div>
          </div>
        </div>

        {/* Meter */}
        <RiskMeter probability={probability} riskCategory={risk_category} />

        {/* Details row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16, marginTop: 28,
        }}>
          {[
            { label: 'Predicted Class', value: predicted_class === 1 ? 'High Risk (1)' : 'Low Risk (0)' },
            { label: 'Probability', value: `${pct}%` },
            { label: 'Risk Category', value: risk_category },
            { label: 'Model', value: model },
          ].map(item => (
            <div key={item.label} style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid #1e293b',
            }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 20,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1e293b',
        }}>
          <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.6 }}>
            ⚠️ This is a <strong>model-predicted probability for demonstration purposes only</strong>.
            This is not a regulatory or bank-approved credit decision. The model was trained on
            historical data and should not be used for real lending decisions.
          </p>
        </div>
      </div>

      {/* SHAP Explanation */}
      <div style={{
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: 16,
        padding: '28px 32px',
      }}>
        <ShapExplanation shap={shap} />
      </div>
    </motion.div>
  );
}
