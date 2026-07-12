// Screen 7 — Maintenance Management (Kanban board)
// Owner: Abinivas | UI fixed by Hari — wrapped in AppLayout + CSS variable system
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import { getMaintenanceRequests } from '../../services/maintenance'
import RaiseRequestModal from './RaiseRequestModal'
import CardActionModal from './CardActionModal'

const KANBAN_COLUMNS = [
  { key: 'Pending',            label: 'Pending',             accent: 'var(--warning)' },
  { key: 'Approved',           label: 'Approved',            accent: 'var(--info, #3b82f6)' },
  { key: 'TechnicianAssigned', label: 'Technician Assigned', accent: 'var(--accent)' },
  { key: 'InProgress',         label: 'In Progress',         accent: '#f97316' },
  { key: 'Resolved',           label: 'Resolved',            accent: 'var(--success)' },
]

const PRIORITY_COLORS = {
  Low:      { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  Medium:   { bg: 'rgba(234,179,8,0.12)',  text: '#facc15', border: 'rgba(234,179,8,0.3)' },
  High:     { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  Critical: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.3)' },
}

function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.Low
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 99, padding: '0.1rem 0.55rem', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  )
}

function fmtRelative(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getActionsForStatus(status) {
  switch (status) {
    case 'Pending':            return [{ key: 'approve', label: 'Approve' }, { key: 'reject', label: 'Reject', danger: true }]
    case 'Approved':           return [{ key: 'assign', label: 'Assign Technician' }]
    case 'TechnicianAssigned': return [{ key: 'inprogress', label: 'Start Work' }]
    case 'InProgress':         return [{ key: 'resolve', label: 'Mark Resolved' }]
    default: return []
  }
}

function MaintenanceCard({ request, status, onAction }) {
  const actions = getActionsForStatus(status)
  return (
    <div id={`card-maintenance-${request.id}`} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent)', marginBottom: '0.1rem' }}>{request.asset?.asset_tag ?? '—'}</div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.asset?.name ?? 'Unknown Asset'}</div>
        </div>
        <PriorityBadge priority={request.priority ?? 'Low'} />
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {request.issue_description}
      </p>

      {request.technician_name && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🔧 {request.technician_name}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
        <span>{request.raised_by?.name ?? '—'}</span>
        <span>{fmtRelative(request.raised_at)}</span>
      </div>

      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {actions.map(a => (
            <button
              key={a.key}
              id={`btn-${a.key}-${request.id}`}
              onClick={() => onAction(request, a.key)}
              className={a.danger ? 'btn btn-sm btn-ghost' : 'btn btn-sm btn-secondary'}
              style={a.danger ? { color: 'var(--danger)' } : {}}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ column, cards, loading }) {
  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `3px solid ${column.accent}`, borderRadius: 12, overflow: 'hidden', maxHeight: 'calc(100vh - 220px)' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{column.label}</span>
        <span style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>
          {loading ? '…' : cards.length}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>}
        {!loading && cards.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No requests</p>}
        {!loading && cards.map(card => <MaintenanceCard key={card.id} request={card} status={column.key} onAction={() => {}} />)}
      </div>
    </div>
  )
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [activeTab, setActiveTab] = useState('board')
  const [showRaiseModal, setShowRaiseModal] = useState(false)
  const [actionTarget, setActionTarget]     = useState(null)

  const loadRequests = useCallback(async () => {
    setLoading(true); setError(null)
    try { setRequests(await getMaintenanceRequests()) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const boardRequests    = requests.filter(r => r.status !== 'Rejected')
  const rejectedRequests = requests.filter(r => r.status === 'Rejected')

  return (
    <AppLayout title="Maintenance">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Maintenance Management</h2>
          <p>Track and manage asset maintenance requests.</p>
        </div>
        <button className="btn btn-primary" id="btn-raise-request" onClick={() => setShowRaiseModal(true)}>
          ＋ Raise Request
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem' }}>
        <button className={`tab${activeTab === 'board' ? ' active' : ''}`} onClick={() => setActiveTab('board')}>
          Main Board <span style={{ marginLeft: '0.4rem', background: 'var(--bg-surface)', borderRadius: 99, padding: '0 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}>{boardRequests.length}</span>
        </button>
        <button className={`tab${activeTab === 'rejected' ? ' active' : ''}`} onClick={() => setActiveTab('rejected')}>
          Rejected <span style={{ marginLeft: '0.4rem', background: 'var(--bg-surface)', borderRadius: 99, padding: '0 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}>{rejectedRequests.length}</span>
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error} <button className="btn btn-sm btn-ghost" onClick={loadRequests} style={{ marginLeft: 8 }}>Retry</button></div>}

      {/* Kanban board */}
      {activeTab === 'board' && (
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map(col => (
              <KanbanColumn key={col.key} column={col} cards={boardRequests.filter(r => r.status === col.key)} loading={loading} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected list */}
      {activeTab === 'rejected' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>}
          {!loading && rejectedRequests.length === 0 && <div className="empty-state"><div className="empty-icon">✅</div><p>No rejected requests.</p></div>}
          {!loading && rejectedRequests.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, fontSize: '1.1rem' }}>✕</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700 }}>{r.asset?.name ?? 'Unknown Asset'}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent)' }}>{r.asset?.asset_tag}</span>
                  <PriorityBadge priority={r.priority ?? 'Low'} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{r.issue_description}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>By {r.raised_by?.name ?? '—'} · {fmtRelative(r.raised_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRaiseModal && <RaiseRequestModal onClose={() => setShowRaiseModal(false)} onSuccess={loadRequests} />}
      {actionTarget  && <CardActionModal request={actionTarget.request} action={actionTarget.action} onClose={() => setActionTarget(null)} onSuccess={loadRequests} />}
    </AppLayout>
  )
}
