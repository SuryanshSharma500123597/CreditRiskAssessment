import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

function formatFeatureName(rawName) {
  if (!rawName) return 'Feature';
  let clean = rawName
    .replace(/^(cat__|num__)/, '')
    .replace(/_/g, ' ');

  // Mapping known feature codes to human-friendly labels
  const mappings = {
    'EXT SOURCE 1': 'External Credit Rating 1',
    'EXT SOURCE 2': 'External Credit Rating 2',
    'EXT SOURCE 3': 'External Credit Rating 3',
    'AMT CREDIT': 'Credit Loan Amount',
    'AMT ANNUITY': 'Loan Annuity Amount',
    'AMT INCOME TOTAL': 'Annual Income',
    'AMT GOODS PRICE': 'Goods Purchase Price',
    'DAYS BIRTH': 'Applicant Age',
    'DAYS EMPLOYED': 'Employment Duration',
    'CNT CHILDREN': 'Number of Children',
    'CNT FAM MEMBERS': 'Family Members Count',
    'CODE GENDER M': 'Gender (Male)',
    'CODE GENDER F': 'Gender (Female)',
    'NAME EDUCATION TYPE Secondary / secondary special': 'Education (Secondary)',
    'NAME EDUCATION TYPE Higher education': 'Education (Higher Education)',
    'NAME INCOME TYPE Working': 'Income Type (Working)',
    'NAME INCOME TYPE Commercial associate': 'Income Type (Commercial)',
    'NAME HOUSING TYPE House / apartment': 'Housing (House / Apartment)',
    'FLAG OWN CAR Y': 'Owns Car (Yes)',
    'FLAG OWN CAR N': 'Owns Car (No)',
    'AGE': 'Applicant Age',
    'YEARS EMPLOYED': 'Employment Duration (Years)',
    'CREDIT INCOME RATIO': 'Credit to Income Ratio',
    'ANNUITY INCOME RATIO': 'Annuity to Income Ratio',
    'GOODS CREDIT RATIO': 'Goods to Credit Ratio',
  };

  for (const [key, label] of Object.entries(mappings)) {
    if (clean.toUpperCase().includes(key)) {
      return label;
    }
  }

  return clean.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function ShapBar({ factor, maxValue, index }) {
  const pct = Math.min(Math.max((Math.abs(factor.value) / maxValue) * 100, 8), 100);
  const isPositive = factor.direction === 'increases_risk' || factor.value > 0;
  const color = isPositive ? '#ef4444' : '#10b981';
  const bgColor = isPositive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)';

  const displayName = formatFeatureName(factor.feature || factor.raw_feature);

  return (
    <motion.div
      initial={{ opacity: 0, x: isPositive ? 16 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        background: bgColor,
        border: `1px solid ${color}20`,
        marginBottom: 8,
      }}
      role="listitem"
    >
      {/* Icon + Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 210, flex: '0 0 210px' }}>
        <span style={{ color, display: 'flex', alignItems: 'center' }}>
          {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
        </span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#f1f5f9',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }} title={displayName}>
          {displayName}
        </span>
      </div>

      {/* Horizontal Bar */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: index * 0.05 + 0.2, duration: 0.4, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 4,
              background: color,
              boxShadow: `0 0 6px ${color}50`,
            }}
          />
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          minWidth: 65,
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
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0.01;

  const hasExplanation = positive.length > 0 || negative.length > 0;

  return (
    <section aria-label="SHAP model explainability factors">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
          SHAP Model Explainability
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Per-prediction feature breakdown showing top factors driving estimated risk up or down.
        </p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        marginBottom: 28,
      }}>
        <Info size={16} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: '#c7d2fe' }}>How to read SHAP values</strong>: Positive values (+ red) increase the estimated risk score, while negative values (- green) reduce risk score. SHAP values describe feature contributions to the model's output and do not imply direct real-world causality.
        </p>
      </div>

      {!hasExplanation && (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#64748b',
          border: '1px dashed #1e293b',
          borderRadius: 12,
        }}>
          SHAP explanation is currently unavailable for this prediction.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {positive.length > 0 && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #1e293b',
            }}>
              <TrendingUp size={16} color="#ef4444" />
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: '#ef4444',
                textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
              }}>
                Top Factors Increasing Risk
              </h3>
            </div>
            <div role="list">
              {positive.map((factor, i) => (
                <ShapBar key={factor.raw_feature || i} factor={factor} maxValue={maxValue} index={i} />
              ))}
            </div>
          </div>
        )}

        {negative.length > 0 && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #1e293b',
            }}>
              <TrendingDown size={16} color="#10b981" />
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: '#10b981',
                textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
              }}>
                Top Factors Reducing Risk
              </h3>
            </div>
            <div role="list">
              {negative.map((factor, i) => (
                <ShapBar key={factor.raw_feature || i} factor={factor} maxValue={maxValue} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
