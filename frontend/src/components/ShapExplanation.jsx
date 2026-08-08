import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

function ShapBar({ factor, maxValue, index }) {
  const pct = Math.abs(factor.value) / maxValue * 100;
  const isPositive = factor.direction === 'increases_risk';
  const color = isPositive ? '#ef4444' : '#10b981';
  const bgColor = isPositive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)';

  // Clean up feature name for display
  const cleanName = factor.feature
    .replace(/^(cat__|num__)/, '')
    .replace(/_/g, ' ')
    .replace(/AMT /g, '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <motion.div
      initial={{ opacity: 0, x: isPositive ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        background: bgColor,
        border: `1px solid ${color}25`,
        marginBottom: 6,
      }}
      role="listitem"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 200, flex: 1 }}>
        <span style={{ fontSize: 12, color, opacity: 0.8 }}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </span>
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#e2e8f0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }} title={factor.feature}>
          {cleanName}
        </span>
      </div>

      {/* Bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: index * 0.06 + 0.3, duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 3,
              background: color,
              boxShadow: `0 0 4px ${color}60`,
            }}
          />
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          minWidth: 50,
          textAlign: 'right',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {factor.value > 0 ? '+' : ''}{factor.value.toFixed(4)}
        </span>
      </div>
    </motion.div>
  );
}

export default function ShapExplanation({ shap }) {
  if (!shap) return null;

  const { positive = [], negative = [] } = shap;
  const allValues = [...positive, ...negative].map(f => Math.abs(f.value));
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;

  const hasExplanation = positive.length > 0 || negative.length > 0;

  return (
    <section aria-label="SHAP explanation of model prediction">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 8,
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          Why did the model make this prediction?
        </h2>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        marginBottom: 24,
      }}>
        <Info size={14} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          SHAP values describe <strong style={{ color: '#c7d2fe' }}>model behavior</strong>, not causality.
          These features do not cause payment difficulty — they are features the model associates with
          higher or lower predicted risk. This is not a regulatory credit decision.
        </p>
      </div>

      {!hasExplanation && (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: '#64748b',
          border: '1px dashed #1e293b',
          borderRadius: 10,
        }}>
          SHAP explanation not available for this prediction.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {positive.length > 0 && (
          <div>
            <h3 style={{
              fontSize: 13, fontWeight: 600, color: '#ef4444',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <TrendingUp size={14} />
              Factors Associated with Higher Risk
            </h3>
            <div role="list">
              {positive.map((factor, i) => (
                <ShapBar key={factor.raw_feature} factor={factor} maxValue={maxValue} index={i} />
              ))}
            </div>
          </div>
        )}

        {negative.length > 0 && (
          <div>
            <h3 style={{
              fontSize: 13, fontWeight: 600, color: '#10b981',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <TrendingDown size={14} />
              Factors Associated with Lower Risk
            </h3>
            <div role="list">
              {negative.map((factor, i) => (
                <ShapBar key={factor.raw_feature} factor={factor} maxValue={maxValue} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
