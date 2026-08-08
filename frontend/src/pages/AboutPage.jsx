import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Section({ title, children }) {
  return (
    <motion.div variants={itemVariants} style={{
      background: '#111827',
      border: '1px solid #1e293b',
      borderRadius: 16, padding: '28px 32px', marginBottom: 20,
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #1e293b' }}>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function TechBadge({ name, color }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '5px 12px', borderRadius: 6, margin: '4px',
      background: `${color}15`, border: `1px solid ${color}40`,
      fontSize: 13, fontWeight: 600, color,
    }}>
      {name}
    </span>
  );
}

const workflowSteps = [
  'Raw Dataset', 'EDA', 'Data Cleaning', 'Feature Engineering',
  'Feature Selection', 'Preprocessing', 'Model Training',
  'XGBoost GPU', 'Hyperparameter Tuning', 'Model Comparison',
  'SHAP Explainability', 'Prediction Pipeline', 'Web Application',
];

export default function AboutPage() {
  return (
    <section id="about" style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 6,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 12, color: '#818cf8', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16,
          }}>
            About This Project
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#f1f5f9', marginBottom: 12 }}>
            About the Project
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7 }}>
            An end-to-end explainable machine learning system for credit risk assessment, built as a summer internship project.
          </p>
        </motion.div>

        {/* Project Objective */}
        <Section title="Project Objective">
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8 }}>
            Many individuals with insufficient credit history struggle to secure loans. Financial institutions need reliable,
            data-driven methods to assess loan default risk. This project applies machine learning to the Home Credit Default Risk
            dataset to predict whether an applicant is likely to experience payment difficulty (TARGET = 1) or not (TARGET = 0).
          </p>
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 8,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0, fontWeight: 600 }}>
              ⚠️ Disclaimer: This is an academic internship demonstration, not a production credit scoring system.
              Results are not intended for real lending decisions.
            </p>
          </div>
        </Section>

        {/* Dataset */}
        <Section title="Dataset">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { label: 'Dataset', value: 'Home Credit Default Risk' },
              { label: 'Applications', value: '307,511' },
              { label: 'Original Features', value: '122 columns' },
              { label: 'Selected Features', value: 'Top 50' },
              { label: 'Model Features', value: '149 (after OHE)' },
              { label: 'Positive Class', value: '~8% (imbalanced)' },
            ].map(item => (
              <div key={item.label} style={{
                padding: '14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b',
              }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Models */}
        <Section title="Machine Learning Models">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { name: 'Logistic Regression', desc: 'Baseline linear model with L2 regularization', color: '#10b981' },
              { name: 'Decision Tree', desc: 'Interpretable tree-based classifier', color: '#f59e0b' },
              { name: 'Random Forest', desc: '100-estimator ensemble with bootstrap aggregating', color: '#f59e0b' },
              { name: 'XGBoost', desc: 'Gradient boosting with GPU acceleration (CUDA)', final: true, color: '#6366f1' },
            ].map(m => (
              <div key={m.name} style={{
                padding: '16px', borderRadius: 12,
                background: m.final ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${m.final ? 'rgba(99,102,241,0.3)' : '#1e293b'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.final ? '#818cf8' : '#e2e8f0' }}>{m.name}</div>
                  {m.final && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 700 }}>FINAL</span>}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Explainability */}
        <Section title="SHAP Explainability">
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.8, marginBottom: 12 }}>
            SHAP (SHapley Additive exPlanations) values are used to explain individual predictions.
            For each applicant, SHAP identifies which features contributed most to increasing or
            decreasing the model's predicted risk — making the "black box" transparent.
          </p>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#94a3b8' }}>Important:</strong> SHAP values describe model behavior, not causality.
            Features associated with higher risk do not cause payment difficulty.
          </p>
        </Section>

        {/* Technology Stack */}
        <Section title="Technology Stack">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Machine Learning</div>
            {['Python 3.10', 'scikit-learn', 'XGBoost 3.2.0', 'SHAP', 'pandas', 'numpy', 'joblib'].map(t => (
              <TechBadge key={t} name={t} color="#10b981" />
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Backend</div>
            {['FastAPI', 'Uvicorn', 'Pydantic'].map(t => (
              <TechBadge key={t} name={t} color="#f59e0b" />
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Frontend</div>
            {['React 19', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'Lucide React'].map(t => (
              <TechBadge key={t} name={t} color="#6366f1" />
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>GPU Acceleration</div>
            <TechBadge name="NVIDIA GeForce RTX 3050 Ti" color="#818cf8" />
            <TechBadge name="4 GB VRAM" color="#818cf8" />
            <TechBadge name="CUDA" color="#818cf8" />
            <TechBadge name="XGBoost tree_method=hist" color="#818cf8" />
          </div>
        </Section>

        {/* Project Workflow */}
        <Section title="Project Workflow">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, alignItems: 'center' }}>
            {workflowSteps.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '8px 14px', borderRadius: 8, margin: '4px',
                  background: step === 'XGBoost GPU' || step === 'Web Application' ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.6)',
                  border: `1px solid ${step === 'XGBoost GPU' || step === 'Web Application' ? 'rgba(99,102,241,0.4)' : '#1e293b'}`,
                  fontSize: 12, fontWeight: 500,
                  color: step === 'XGBoost GPU' || step === 'Web Application' ? '#818cf8' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}>
                  {step}
                </div>
                {i < workflowSteps.length - 1 && (
                  <span style={{ color: '#2d3748', fontSize: 14 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* API Endpoints */}
        <Section title="API Endpoints">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { method: 'GET', path: '/api/health', desc: 'System health check' },
              { method: 'GET', path: '/api/model-info', desc: 'Final model information' },
              { method: 'GET', path: '/api/model-comparison', desc: 'All model performance metrics' },
              { method: 'GET', path: '/api/shap/features', desc: 'Global feature importance' },
              { method: 'POST', path: '/api/predict', desc: 'Predict credit risk for an applicant' },
              { method: 'GET', path: '/api/demo-applicant', desc: 'Load demo applicant data' },
            ].map(ep => (
              <div key={ep.path} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b',
              }}>
                <span style={{
                  padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                  background: ep.method === 'POST' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)',
                  color: ep.method === 'POST' ? '#818cf8' : '#10b981',
                  minWidth: 42, textAlign: 'center',
                }}>
                  {ep.method}
                </span>
                <code style={{ fontSize: 13, color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>
                  {ep.path}
                </code>
                <span style={{ fontSize: 12, color: '#64748b' }}>{ep.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Limitations */}
        <Section title="Limitations & Disclaimer">
          <ul style={{ fontSize: 14, color: '#94a3b8', lineHeight: 2, paddingLeft: 20 }}>
            <li>This is an internship demonstration project, <strong style={{ color: '#e2e8f0' }}>not a production banking system</strong>.</li>
            <li>Risk thresholds (30%/60%) are for demonstration only — not regulatory credit thresholds.</li>
            <li>The model is trained on historical data and may not generalize to all populations.</li>
            <li>No applicant data is stored permanently — predictions are session-only.</li>
            <li>SHAP explanations describe model behavior, not real-world causality.</li>
          </ul>
        </Section>
      </motion.div>
    </section>
  );
}
