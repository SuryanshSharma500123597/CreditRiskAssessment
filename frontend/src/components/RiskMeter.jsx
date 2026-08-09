import { motion } from 'framer-motion';

/**
 * RiskMeter — visual probability gauge with risk zones
 */
export default function RiskMeter({ probability, riskCategory }) {
  const pct = Math.round(probability * 100);

  // Color based on risk
  const color = riskCategory === 'HIGH' ? '#ef4444'
    : riskCategory === 'MEDIUM' ? '#f59e0b'
    : '#10b981';

  const bgColor = riskCategory === 'HIGH' ? 'rgba(239,68,68,0.1)'
    : riskCategory === 'MEDIUM' ? 'rgba(245,158,11,0.1)'
    : 'rgba(16,185,129,0.1)';

  return (
    <div
      style={{ width: '100%' }}
      role="img"
      aria-label={`Risk meter showing ${pct}% probability - ${riskCategory} risk`}
    >
      {/* Meter label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>LOW</span>
        <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>MEDIUM</span>
        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>HIGH</span>
      </div>

      {/* Track */}
      <div style={{
        width: '100%',
        height: 12,
        borderRadius: 6,
        background: 'linear-gradient(to right, #10b981 0%, #10b981 35%, #f59e0b 35%, #f59e0b 64%, #ef4444 64%, #ef4444 100%)',
        position: 'relative',
        overflow: 'visible',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      }}>
        {/* Threshold markers */}
        <div style={{
          position: 'absolute', left: '35%', top: -4, bottom: -4,
          width: 2, background: 'rgba(255,255,255,0.4)', borderRadius: 1,
        }} />
        <div style={{
          position: 'absolute', left: '64%', top: -4, bottom: -4,
          width: 2, background: 'rgba(255,255,255,0.4)', borderRadius: 1,
        }} />

        {/* Needle */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${Math.min(Math.max(pct, 2), 98)}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: color,
            border: '3px solid white',
            boxShadow: `0 0 12px ${color}, 0 2px 8px rgba(0,0,0,0.5)`,
          }}
        />
      </div>

      {/* Threshold labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, position: 'relative' }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>0%</span>
        <span style={{ fontSize: 11, color: '#64748b', position: 'absolute', left: '35%', transform: 'translateX(-50%)' }}>35%</span>
        <span style={{ fontSize: 11, color: '#64748b', position: 'absolute', left: '64%', transform: 'translateX(-50%)' }}>64%</span>
        <span style={{ fontSize: 11, color: '#64748b' }}>100%</span>
      </div>

      {/* Risk category badge */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 24,
            background: bgColor,
            border: `1px solid ${color}40`,
          }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}`,
          }} />
          <span style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: '0.05em' }}>
            {riskCategory} RISK
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
            {pct}%
          </span>
        </motion.div>
      </div>
    </div>
  );
}
