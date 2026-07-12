/**
 * MaintenancePage — Screen 7: Maintenance Management
 *
 * Layout:
 *   - Header with "Raise Request" button
 *   - Tab switcher: Main Board | Rejected
 *   - Main Board: Kanban with 5 columns
 *       Pending | Approved | Technician Assigned | In Progress | Resolved
 *   - Rejected tab: separate list (not in Kanban)
 *
 * Each card shows:
 *   asset name, issue description, priority badge, raised by, raised at
 *
 * Card action buttons (Part 7):
 *   Asset Manager: Approve/Reject (Pending), Assign Tech (Approved),
 *                  In Progress / Resolve (TechnicianAssigned)
 *
 * Business rule (PRODUCT_CONTEXT §8):
 *   Maintenance APPROVAL (not raise) flips asset to UnderMaintenance.
 *   This is enforced server-side — frontend just shows the result.
 */

import { useState, useEffect, useCallback } from 'react'
import { getMaintenanceRequests, updateStatus } from '../../services/maintenance'

/* ─── Constants ──────────────────────────────────────────────── */

const KANBAN_COLUMNS = [
  { key: 'Pending',            label: 'Pending',             color: 'border-t-amber-500' },
  { key: 'Approved',           label: 'Approved',            color: 'border-t-blue-500' },
  { key: 'TechnicianAssigned', label: 'Technician Assigned', color: 'border-t-violet-500' },
  { key: 'InProgress',         label: 'In Progress',         color: 'border-t-orange-500' },
  { key: 'Resolved',           label: 'Resolved',            color: 'border-t-emerald-500' },
]

const PRIORITY_STYLES = {
  Low:      { dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  Medium:   { dot: 'bg-yellow-400',  text: 'text-yellow-400',  badge: 'bg-yellow-500/15  text-yellow-400  border-yellow-500/30' },
  High:     { dot: 'bg-orange-400',  text: 'text-orange-400',  badge: 'bg-orange-500/15  text-orange-400  border-orange-500/30' },
  Critical: { dot: 'bg-red-400',     text: 'text-red-400',     badge: 'bg-red-500/15     text-red-400     border-red-500/30' },
}

function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
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
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ─── Main page ──────────────────────────────────────────────── */

export default function MaintenancePage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('board') // 'board' | 'rejected'

  // Modal state (wired in Part 7)
  const [showRaiseModal, setShowRaiseModal] = useState(false)
  const [actionTarget, setActionTarget] = useState(null) // { request, action }

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMaintenanceRequests()
      setRequests(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const boardRequests  = requests.filter(r => r.status !== 'Rejected')
  const rejectedRequests = requests.filter(r => r.status === 'Rejected')

  // Count by column for header badges
  const countByStatus = {}
  requests.forEach(r => { countByStatus[r.status] = (countByStatus[r.status] ?? 0) + 1 })

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* ── Page header ── */}
      <div className="border-b border-gray-800 bg-gray-900/50 shrink-0">
        <div className="max-w-screen-xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track and manage asset maintenance requests</p>
          </div>
          <button
            id="btn-raise-request"
            onClick={() => setShowRaiseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Raise Request
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-800 bg-gray-900/30 shrink-0">
        <div className="max-w-screen-xl mx-auto px-6 flex gap-1 pt-2">
          {[
            { key: 'board',    label: 'Main Board', count: boardRequests.length },
            { key: 'rejected', label: 'Rejected',   count: rejectedRequests.length },
          ].map(tab => (
            <button
              key={tab.key}
              id={`tab-maintenance-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'text-violet-400 bg-gray-800 border-b-2 border-violet-500'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.key ? 'bg-violet-500/30 text-violet-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={loadRequests} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'board' && (
          <KanbanBoard
            requests={boardRequests}
            loading={loading}
            onAction={(request, action) => setActionTarget({ request, action })}
            onRefresh={loadRequests}
          />
        )}
        {activeTab === 'rejected' && (
          <RejectedList requests={rejectedRequests} loading={loading} />
        )}
      </div>

      {/* Modals — wired in Part 7 */}
      {showRaiseModal && (
        <RaiseModalPlaceholder onClose={() => setShowRaiseModal(false)} onSuccess={loadRequests} />
      )}
      {actionTarget && (
        <ActionModalPlaceholder
          request={actionTarget.request}
          action={actionTarget.action}
          onClose={() => setActionTarget(null)}
          onSuccess={loadRequests}
        />
      )}
    </div>
  )
}

/* ─── Kanban Board ───────────────────────────────────────────── */

function KanbanBoard({ requests, loading, onAction, onRefresh }) {
  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 p-6 min-w-max h-full">
        {KANBAN_COLUMNS.map(col => {
          const cards = requests.filter(r => r.status === col.key)
          return (
            <KanbanColumn
              key={col.key}
              column={col}
              cards={cards}
              loading={loading}
              onAction={onAction}
            />
          )
        })}
      </div>
    </div>
  )
}

function KanbanColumn({ column, cards, loading, onAction }) {
  return (
    <div className={`w-72 shrink-0 flex flex-col bg-gray-900 border border-gray-800 border-t-4 ${column.color} rounded-xl overflow-hidden`}>
      {/* Column header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-200">{column.label}</span>
        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs font-bold rounded-full">
          {loading ? '…' : cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <svg className="w-4 h-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {!loading && cards.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-gray-600">No requests</p>
          </div>
        )}
        {!loading && cards.map(card => (
          <MaintenanceCard key={card.id} request={card} status={column.key} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}

/* ─── Maintenance Card ───────────────────────────────────────── */

function MaintenanceCard({ request, status, onAction }) {
  return (
    <div
      id={`card-maintenance-${request.id}`}
      className="bg-gray-800 border border-gray-700 rounded-xl p-3.5 space-y-3 hover:border-gray-600 transition-colors"
    >
      {/* Asset + priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono text-violet-400">{request.asset?.asset_tag ?? '—'}</p>
          <p className="text-sm font-semibold text-white truncate">{request.asset?.name ?? 'Unknown Asset'}</p>
        </div>
        <PriorityBadge priority={request.priority ?? 'Low'} />
      </div>

      {/* Issue description */}
      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
        {request.issue_description}
      </p>

      {/* Technician (if assigned) */}
      {request.technician_name && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{request.technician_name}</span>
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{request.raised_by?.name ?? 'Unknown'}</span>
        <span>{fmtRelative(request.raised_at)}</span>
      </div>

      {/* Action buttons — role-aware (wired in Part 7) */}
      <CardActions request={request} status={status} onAction={onAction} />
    </div>
  )
}

/**
 * CardActions — shows action buttons based on current status.
 * Role check is a simple approach: try to determine from the session.
 * Full role guard will come when Hari's AuthContext is available.
 * For now we show all actions and let the server reject unauthorized ones (403).
 */
function CardActions({ request, status, onAction }) {
  const actions = getActionsForStatus(status)
  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-700/50">
      {actions.map(action => (
        <button
          key={action.key}
          id={`btn-${action.key}-${request.id}`}
          onClick={() => onAction(request, action.key)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${action.cls}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}

function getActionsForStatus(status) {
  switch (status) {
    case 'Pending':
      return [
        { key: 'approve', label: 'Approve', cls: 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300' },
        { key: 'reject',  label: 'Reject',  cls: 'bg-red-600/20  hover:bg-red-600/40  text-red-400' },
      ]
    case 'Approved':
      return [
        { key: 'assign', label: 'Assign Technician', cls: 'bg-violet-600/30 hover:bg-violet-600/50 text-violet-300' },
      ]
    case 'TechnicianAssigned':
      return [
        { key: 'inprogress', label: 'Mark In Progress', cls: 'bg-orange-600/30 hover:bg-orange-600/50 text-orange-300' },
      ]
    case 'InProgress':
      return [
        { key: 'resolve', label: 'Mark Resolved', cls: 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300' },
      ]
    default:
      return []
  }
}

/* ─── Rejected list (separate tab) ──────────────────────────── */

function RejectedList({ requests, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
        <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-3">
      {requests.length === 0 && (
        <div className="text-center py-16 text-gray-600 text-sm">No rejected requests</div>
      )}
      {requests.map(r => (
        <div key={r.id} className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
          <div className="p-2 rounded-lg bg-red-500/10">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{r.asset?.name ?? 'Unknown Asset'}</span>
              <span className="text-xs font-mono text-violet-400">{r.asset?.asset_tag}</span>
              <PriorityBadge priority={r.priority ?? 'Low'} />
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.issue_description}</p>
            <p className="text-xs text-gray-600 mt-1">
              By {r.raised_by?.name ?? '—'} · {fmtRelative(r.raised_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Modal placeholders (replaced in Part 7) ───────────────── */

function RaiseModalPlaceholder({ onClose }) {
  return (
    <ModalShell title="Raise Maintenance Request" onClose={onClose}>
      <p className="text-gray-400 text-sm py-4">Raise request form coming in Part 7…</p>
    </ModalShell>
  )
}

function ActionModalPlaceholder({ request, action, onClose }) {
  return (
    <ModalShell title={`${action}: ${request.asset?.name ?? 'Asset'}`} onClose={onClose}>
      <p className="text-gray-400 text-sm py-4">Action modal coming in Part 7…</p>
    </ModalShell>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white capitalize">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
