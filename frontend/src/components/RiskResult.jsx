import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, ShieldAlert as ShieldWarn, Sparkles } from 'lucide-react';
import RiskMeter from './RiskMeter';
import ShapExplanation from './ShapExplanation';

export default function RiskResult({ result }) {
  if (!result) return null;

  const { predicted_class, probability, risk_category, model, shap } = result;
  const pct = (probability * 100).toFixed(2);

  const riskColor = risk_category === 'HIGH' ? '#ef4444'
    : risk_category === 'MEDIUM' ? '#f59e0b'
    : '#10b981';

  const riskBg = risk_category === 'HIGH' ? 'rgba(239,68,68,0.06)'
    : risk_category === 'MEDIUM' ? 'rgba(245,158,11,0.06)'
    : 'rgba(16,185,129,0.06)';

  const RiskIcon = risk_category === 'HIGH' ? ShieldAlert
    : risk_category === 'MEDIUM' ? ShieldWarn
    : ShieldCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Assessment Complete Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 16,
      }}>
        <Sparkles size={16} color="#818cf8" />
        <span style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Assessment Complete
        </span>
      </div>

      {/* Main result card */}
      <div style={{
        border: `1px solid ${riskColor}40`,
        borderRadius: 16,
        background: riskBg,
        padding: '32px',
        marginBottom: 28,
        boxShadow: `0 8px 30px ${riskColor}10`,
      }}
        role="region"
        aria-label="Credit risk assessment result summary"
      >
        {/* Header summary */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 28, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Risk Assessment Level
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${riskColor}18`, border: `1px solid ${riskColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <RiskIcon size={24} color={riskColor} aria-hidden="true" />
              </div>
              <div>
                <span style={{ fontSize: 28, fontWeight: 900, color: riskColor, letterSpacing: '-0.02em' }}>
                  {risk_category} RISK
                </span>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Model-estimated credit risk profile
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Default Probability
            </div>
            <div style={{
              fontSize: 52,
              fontWeight: 900,
              color: riskColor,
              fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}>
              {pct}%
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
              Estimated probability of payment difficulty
            </div>
          </div>
        </div>

        {/* Meter */}
        <RiskMeter probability={probability} riskCategory={risk_category} />

        {/* Details row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 16, marginTop: 32,
        }}>
          {[
            { label: 'Risk Score', value: `${pct}%` },
            { label: 'Risk Level', value: `${risk_category} RISK` },
            { label: 'Predicted Class', value: predicted_class === 1 ? 'High Risk (1)' : 'Low Risk (0)' },
            { label: 'Model', value: model },
          ].map(item => (
            <div key={item.label} style={{
              padding: '16px 18px',
              borderRadius: 12,
              background: '#111827',
              border: '1px solid #1e293b',
            }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Academic Disclaimer */}
        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(17,24,39,0.8)',
          border: '1px solid #1e293b',
        }}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            ⚠️ <strong>Academic Disclaimer</strong>: This risk score is a model-estimated probability for educational and demonstration purposes. It is derived from historical Home Credit application metrics and does not constitute an official banking credit decision.
          </p>
        </div>
      </div>

      {/* SHAP Explanation */}
      <div style={{
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: 16,
        padding: '32px',
      }}>
        <ShapExplanation shap={shap} />
      </div>
    </motion.div>
  );
}
