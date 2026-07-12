// Screen 2 — Dashboard
import { useState, useEffect } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import KPICard from '../../components/shared/KPICard'
import StatusBadge from '../../components/shared/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState({ available: 0, allocated: 0, maintenance: 0, bookings: 0, transfers: 0, upcoming: 0, overdue: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const today = new Date().toISOString()
    const [
      { count: available },
      { count: allocated },
      { count: maintenance },
      { count: bookings },
      { count: transfers },
      { count: overdue },
      { data: activity },
    ] = await Promise.all([
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'Available'),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'Allocated'),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'UnderMaintenance'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['Upcoming', 'Ongoing']),
      supabase.from('transfer_requests').select('*', { count: 'exact', head: true }).eq('status', 'Requested'),
      supabase.from('allocations').select('*', { count: 'exact', head: true }).eq('status', 'Active').lt('expected_return_date', today),
      supabase.from('activity_logs').select('id, action, entity_type, metadata, created_at, actors:actor_id(name)').order('created_at', { ascending: false }).limit(8),
    ])
    setKpis({ available: available ?? 0, allocated: allocated ?? 0, maintenance: maintenance ?? 0, bookings: bookings ?? 0, transfers: transfers ?? 0, overdue: overdue ?? 0 })
    setRecent(activity ?? [])
    setLoading(false)
  }

  const kpiCards = [
    { label: 'Available Assets',   value: kpis.available,   icon: '📦', color: '#10b981', to: '/assets' },
    { label: 'Allocated Assets',   value: kpis.allocated,   icon: '🔗', color: '#3b82f6', to: '/allocations' },
    { label: 'Under Maintenance',  value: kpis.maintenance, icon: '🔧', color: '#f59e0b', to: '/maintenance' },
    { label: 'Active Bookings',    value: kpis.bookings,    icon: '📅', color: '#6366f1', to: '/bookings' },
    { label: 'Pending Transfers',  value: kpis.transfers,   icon: '🔄', color: '#8b5cf6', to: '/allocations' },
    { label: 'Overdue Returns',    value: kpis.overdue,     icon: '⚠️',  color: '#ef4444', to: '/allocations' },
  ]

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <div>
          <h2>Good day, {profile?.name?.split(' ')[0] ?? 'there'} 👋</h2>
          <p>Here's what's happening across your assets today.</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => navigate('/assets')}>＋ Register Asset</button>
          <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>📅 Book Resource</button>
          <button className="btn btn-secondary" onClick={() => navigate('/maintenance')}>🔧 Raise Maintenance</button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        {kpiCards.map(k => (
          <KPICard key={k.label} label={k.label} value={loading ? '…' : k.value} icon={k.icon} color={k.color} onClick={() => navigate(k.to)} />
        ))}
      </div>

      {/* Overdue alert banner */}
      {!loading && kpis.overdue > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong style={{ color: '#f87171' }}>{kpis.overdue} overdue return{kpis.overdue > 1 ? 's' : ''}</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}> — assets past their expected return date.</span>
          </div>
          <button className="btn btn-sm btn-danger" style={{ marginLeft: 'auto' }} onClick={() => navigate('/allocations')}>
            View →
          </button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Activity</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/logs')}>View all →</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : recent.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><p>No activity yet.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            {recent.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                  {log.entity_type === 'asset' ? '📦' : log.entity_type === 'booking' ? '📅' : log.entity_type === 'maintenance' ? '🔧' : '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>{log.actors?.name ?? 'System'}</strong> — {log.action?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
