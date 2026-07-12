// src/pages/assets/AssetDetailPage.jsx
import { useState, useEffect } from 'react'
import { getAssetHistories } from '../../services/assets'
import StatusBadge from '../../components/shared/StatusBadge'

export default function AssetDetailPage({ asset, onClose }) {
  const [activeTab, setActiveTab] = useState('allocation') // 'allocation' | 'maintenance'
  const [history, setHistory] = useState({ allocations: [], maintenance: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!asset) return
    let active = true

    async function loadHistory() {
      setLoading(true)
      try {
        const data = await getAssetHistories(asset.id)
        if (active) {
          setHistory(data)
        }
      } catch (err) {
        console.error('Failed to load asset history:', err)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadHistory()
    return () => { active = false }
  }, [asset])

  if (!asset) return null

  return (
    <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer-box">
        <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-accent" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 'bold' }}>{asset.asset_tag}</span>
              <StatusBadge status={asset.status} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem' }}>{asset.name}</h3>
          </div>
          <button className="modal-close" onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Asset Meta Info */}
          <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Serial Number</span>
                <strong>{asset.serial_number || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>QR Code</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{asset.qr_code || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Acquisition Date</span>
                <strong>{asset.acquisition_date || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Cost</span>
                <strong>${asset.acquisition_cost?.toLocaleString() || '0'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Condition</span>
                <strong>{asset.condition || 'Excellent'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Location</span>
                <strong>{asset.location || 'N/A'}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Resource Type</span>
                <strong>{asset.is_bookable ? '📅 Bookable Shared Resource' : '📦 Allocation-only Asset'}</strong>
              </div>
            </div>
          </div>

          {/* History Tabs */}
          <div>
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              <button
                className={`tab ${activeTab === 'allocation' ? 'active' : ''}`}
                onClick={() => setActiveTab('allocation')}
              >
                Allocation History
              </button>
              <button
                className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`}
                onClick={() => setActiveTab('maintenance')}
              >
                Maintenance History
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : activeTab === 'allocation' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.allocations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No allocation records found for this asset.
                  </div>
                ) : (
                  history.allocations.map(alloc => (
                    <div key={alloc.id} className="card" style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong>{alloc.employee_name || 'Department Allocation'}</strong>
                        <span className={`badge ${alloc.status === 'Active' ? 'badge-allocated' : alloc.status === 'Overdue' ? 'badge-lost' : 'badge-available'}`}>
                          {alloc.status}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Dept: {alloc.department_name || 'N/A'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Allocated: {alloc.allocated_at} {alloc.expected_return_date ? `| Expected Return: ${alloc.expected_return_date}` : ''}
                      </div>
                      {alloc.actual_return_date && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          Returned: {alloc.actual_return_date}
                        </div>
                      )}
                      {alloc.return_condition_notes && (
                        <div style={{ background: 'var(--bg-base)', padding: '0.4rem 0.6rem', borderRadius: '6px', marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.78rem' }}>
                          Notes: {alloc.return_condition_notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {history.maintenance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No maintenance records found for this asset.
                  </div>
                ) : (
                  history.maintenance.map(maint => (
                    <div key={maint.id} className="card" style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <strong>Issue: {maint.issue_description}</strong>
                        <span className={`badge ${maint.status === 'Resolved' ? 'badge-available' : 'badge-pending'}`}>
                          {maint.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        <span>Priority: <span style={{ color: maint.priority === 'Critical' || maint.priority === 'High' ? 'var(--danger)' : 'var(--text-secondary)' }}>{maint.priority}</span></span>
                        <span>Tech: {maint.technician_name || 'Not assigned'}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Raised at: {maint.raised_at} {maint.resolved_at ? `| Resolved: ${maint.resolved_at}` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
