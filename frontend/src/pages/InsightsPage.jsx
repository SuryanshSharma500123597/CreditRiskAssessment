import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Cpu, Zap } from 'lucide-react';
import { getModelComparison, getShapFeatures } from '../services/api';

const MODEL_COLORS = {
  'Tuned XGBoost (GPU)': '#6366f1',
  'Logistic Regression': '#10b981',
  'XGBoost': '#818cf8',
  'Random Forest': '#f59e0b',
  'Decision Tree': '#94a3b8',
};

function MetricBadge({ value, highlight }) {
  return (
    <span style={{
      fontSize: 14, fontWeight: 700,
      color: highlight ? '#818cf8' : '#e2e8f0',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {typeof value === 'number' ? value.toFixed(4) : value ?? '—'}
    </span>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function InsightsPage() {
  const [comparison, setComparison] = useState(null);
  const [shapFeatures, setShapFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cmpData, shapData] = await Promise.all([
          getModelComparison(),
          getShapFeatures(15),
        ]);
        setComparison(cmpData);
        setShapFeatures(shapData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #1e293b', borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem',
        }} />
        Loading model insights...
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
        Failed to load insights: {error}
      </div>
    );
  }

  const models = comparison?.models || [];
  const finalModel = comparison?.final_model || 'Tuned XGBoost (GPU)';

  // Prepare chart data
  const rocData = models.map(m => ({
    name: m.Model.replace('Tuned XGBoost (GPU)', 'Tuned XGB').replace('Logistic Regression', 'Log. Reg.').replace('Random Forest', 'Rand. Forest').replace('Decision Tree', 'Dec. Tree'),
    fullName: m.Model,
    value: m['ROC-AUC'],
  }));

  const shapData = (shapFeatures?.features || []).map(f => ({
    name: f.clean_name.length > 24 ? f.clean_name.slice(0, 24) + '…' : f.clean_name,
    fullName: f.clean_name,
    value: f.importance,
  }));

  return (
    <section id="insights" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 6,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 12, color: '#818cf8', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Model Insights
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9', marginBottom: 12 }}>
            Model Performance & Explainability
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7 }}>
            Comparison of all trained models on the Home Credit Default Risk test set.
          </p>
        </motion.div>

        {/* Final model card */}
        <motion.div variants={itemVariants}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.06))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 16,
            padding: '24px 28px',
            marginBottom: 32,
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trophy size={24} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Final Selected Model
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                  {finalModel}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { icon: <Cpu size={14} />, label: 'CUDA GPU', color: '#818cf8' },
                { icon: <Zap size={14} />, label: 'SHAP Explainability', color: '#10b981' },
              ].map(badge => (
                <div key={badge.label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b',
                  fontSize: 13, fontWeight: 600, color: badge.color,
                }}>
                  {badge.icon} {badge.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ROC-AUC chart */}
        <motion.div variants={itemVariants}>
          <div style={{
            background: '#111827', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px 28px', marginBottom: 32,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
              ROC-AUC Comparison
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              Area Under the Receiver Operating Characteristic Curve — higher is better.
            </p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rocData} barSize={36}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0.4, 0.85]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a2332', border: '1px solid #2d3748',
                      borderRadius: 8, color: '#f1f5f9', fontSize: 13,
                    }}
                    formatter={(v, _, props) => [v.toFixed(4), props.payload.fullName]}
                    cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {rocData.map((entry) => (
                      <Cell
                        key={entry.fullName}
                        fill={entry.fullName === finalModel ? '#6366f1' : '#1e293b'}
                        stroke={entry.fullName === finalModel ? '#818cf8' : '#2d3748'}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Model comparison table */}
        <motion.div variants={itemVariants}>
          <div style={{
            background: '#111827', border: '1px solid #1e293b',
            borderRadius: 16, padding: '24px 28px', marginBottom: 32,
            overflowX: 'auto',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
              Detailed Model Comparison
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              All metrics computed on the held-out test set (61,503 applicants).
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
              aria-label="Model performance comparison table">
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {['Model', 'Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC', 'MCC'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: h === 'Model' ? 'left' : 'right',
                      color: '#64748b', fontWeight: 600, fontSize: 12,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.sort((a, b) => b['ROC-AUC'] - a['ROC-AUC']).map((m, i) => {
                  const isFinal = m.Model === finalModel;
                  return (
                    <tr key={m.Model}
                      style={{
                        borderBottom: '1px solid #0f172a',
                        background: isFinal ? 'rgba(99,102,241,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: isFinal ? 700 : 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: MODEL_COLORS[m.Model] || '#64748b',
                            flexShrink: 0,
                          }} />
                          <span style={{ color: isFinal ? '#818cf8' : '#e2e8f0' }}>{m.Model}</span>
                          {isFinal && (
                            <span style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 4,
                              background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 700,
                            }}>FINAL</span>
                          )}
                        </div>
                      </td>
                      {['Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC', 'MCC'].map(metric => (
                        <td key={metric} style={{ padding: '12px', textAlign: 'right' }}>
                          <MetricBadge value={m[metric]} highlight={isFinal && metric === 'ROC-AUC'} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Feature importance chart */}
        {shapData.length > 0 && (
          <motion.div variants={itemVariants}>
            <div style={{
              background: '#111827', border: '1px solid #1e293b',
              borderRadius: 16, padding: '24px 28px',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                Most Influential Features
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                {shapFeatures?.source || 'Feature importance from the final model.'}
              </p>
              <p style={{ fontSize: 12, color: '#475569', marginBottom: 24 }}>
                These features had the greatest influence on the model's predictions.
              </p>
              <div style={{ height: Math.max(200, shapData.length * 30) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shapData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={180} />
                    <Tooltip
                      contentStyle={{
                        background: '#1a2332', border: '1px solid #2d3748',
                        borderRadius: 8, color: '#f1f5f9', fontSize: 13,
                      }}
                      formatter={(v, _, props) => [v.toFixed(6), props.payload.fullName]}
                      cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
