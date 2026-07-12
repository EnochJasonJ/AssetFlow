// KPICard — dashboard stat card
// Usage: <KPICard label="Assets Available" value={42} icon="📦" color="#10b981" />
export default function KPICard({ label, value, icon, color = 'var(--accent)', onClick, sub }) {
  return (
    <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="kpi-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="kpi-value" style={{ color }}>{value ?? '—'}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{sub}</div>}
    </div>
  )
}
