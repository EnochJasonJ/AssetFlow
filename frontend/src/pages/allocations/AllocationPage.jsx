/**
 * AllocationPage — Screen 5: Asset Allocation & Transfer
 *
 * Renders:
 *   - Header with "Allocate Asset" button
 *   - Summary KPI strip (total, active, overdue)
 *   - Allocation table: overdue rows pinned to top and highlighted red
 *   - Per-row actions: Return, Request Transfer (stubs for Part 4)
 *
 * Modals (Part 3 & 4):
 *   - AllocateModal — allocate an asset (conflict-aware)
 *   - ReturnModal — return with condition notes
 *   - TransferModal — request a transfer
 */

import { useState, useEffect, useCallback } from 'react'
import { getAllocations } from '../../services/allocations'
import AllocateModal from './AllocateModal'
import ReturnModal from './ReturnModal'
import TransferModal from './TransferModal'

/** Determine if an allocation is overdue (query-time check) */
function isOverdue(allocation) {
  if (allocation.status !== 'Active') return false
  if (!allocation.expected_return_date) return false
  return new Date(allocation.expected_return_date) < new Date()
}

/** Status badge chip */
function StatusBadge({ status, overdue }) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold'
  if (overdue) return <span className={`${base} bg-red-500/20 text-red-400 border border-red-500/30`}>Overdue</span>
  const map = {
    Active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    Returned: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    Overdue: 'bg-red-500/20 text-red-400 border border-red-500/30',
  }
  return <span className={`${base} ${map[status] ?? 'bg-gray-700 text-gray-300'}`}>{status}</span>
}

/** Format a date string for display */
function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AllocationPage() {
  const [allocations, setAllocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal state (wired in Part 3 & 4)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [returnTarget, setReturnTarget] = useState(null)   // allocation to return
  const [transferTarget, setTransferTarget] = useState(null) // allocation to transfer

  const loadAllocations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllocations()
      setAllocations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAllocations() }, [loadAllocations])

  // Split: overdue first (sorted by how overdue), then active, then returned
  const overdueRows = allocations
    .filter(a => isOverdue(a))
    .sort((a, b) => new Date(a.expected_return_date) - new Date(b.expected_return_date))

  const activeRows = allocations.filter(a => a.status === 'Active' && !isOverdue(a))
  const returnedRows = allocations.filter(a => a.status === 'Returned')
  const orderedRows = [...overdueRows, ...activeRows, ...returnedRows]

  const totalActive = allocations.filter(a => a.status === 'Active').length
  const totalOverdue = overdueRows.length

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Page header ── */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Asset Allocation</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage asset assignments, transfers, and returns</p>
          </div>
          <button
            id="btn-allocate-asset"
            onClick={() => setShowAllocateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Allocate Asset
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            label="Total Active"
            value={loading ? '…' : totalActive}
            color="text-emerald-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            label="Overdue"
            value={loading ? '…' : totalOverdue}
            color={totalOverdue > 0 ? 'text-red-400' : 'text-gray-400'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            label="All Allocations"
            value={loading ? '…' : allocations.length}
            color="text-violet-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
          />
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
            <button onClick={loadAllocations} className="ml-auto underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* ── Overdue banner (shown only when there are overdue items) ── */}
        {!loading && totalOverdue > 0 && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {totalOverdue} allocation{totalOverdue > 1 ? 's are' : ' is'} overdue — shown at the top of the table
          </div>
        )}

        {/* ── Allocation table ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocated</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected Return</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading allocations…
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && orderedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No allocations found
                    </td>
                  </tr>
                )}

                {!loading && orderedRows.map(allocation => {
                  const overdue = isOverdue(allocation)
                  const rowBg = overdue
                    ? 'bg-red-950/30 hover:bg-red-950/50'
                    : 'hover:bg-gray-800/40'
                  return (
                    <tr key={allocation.id} className={`transition-colors ${rowBg}`}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-violet-400">{allocation.asset?.asset_tag ?? '—'}</div>
                        <div className="text-gray-200 font-medium">{allocation.asset?.name ?? 'Unknown Asset'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-200">{allocation.employee?.name ?? '—'}</div>
                        <div className="text-xs text-gray-500">{allocation.employee?.email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {allocation.department?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {fmtDate(allocation.allocated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${overdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                          {fmtDate(allocation.expected_return_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={allocation.status} overdue={overdue} />
                      </td>
                      <td className="px-4 py-3">
                        <AllocationActions
                          allocation={allocation}
                          overdue={overdue}
                          onReturn={() => setReturnTarget(allocation)}
                          onTransfer={() => setTransferTarget(allocation)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modals — wired in Part 3 & 4 */}
      {showAllocateModal && (
        <AllocateModal
          onClose={() => setShowAllocateModal(false)}
          onSuccess={loadAllocations}
          onRequestTransfer={({ assetId, conflict }) => {
            // Pre-fill transfer modal with the conflicted asset
            setShowAllocateModal(false)
            setTransferTarget({ id: null, asset: { id: assetId }, _conflict: conflict })
          }}
        />
      )}
      {returnTarget && (
        <ReturnModal
          allocation={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSuccess={loadAllocations}
        />
      )}
      {transferTarget && (
        <TransferModal
          allocation={transferTarget}
          onClose={() => setTransferTarget(null)}
          onSuccess={loadAllocations}
        />
      )}
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function KPICard({ label, value, color, icon }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg bg-gray-800 ${color}`}>{icon}</div>
      <div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function AllocationActions({ allocation, overdue, onReturn, onTransfer }) {
  if (allocation.status === 'Returned') {
    return <span className="text-xs text-gray-600">Returned</span>
  }

  return (
    <div className="flex items-center gap-2">
      {/* Return — available for active allocations */}
      {allocation.status === 'Active' && (
        <button
          id={`btn-return-${allocation.id}`}
          onClick={onReturn}
          className="px-2.5 py-1 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-md transition-colors"
        >
          Return
        </button>
      )}
      {/* Transfer — offer when overdue or as alternative */}
      {allocation.status === 'Active' && (
        <button
          id={`btn-transfer-${allocation.id}`}
          onClick={onTransfer}
          className="px-2.5 py-1 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-violet-400 hover:text-violet-300 rounded-md transition-colors"
        >
          Transfer
        </button>
      )}
    </div>
  )
}

/* ─── Modal placeholders (replaced in Part 3 & 4) ────────────── */

// AllocateModal is now a separate component (AllocateModal.jsx)

// ReturnModal and TransferModal are in their own files

/** Minimal modal shell (will be swapped for Hari's <Modal> when available) */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
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
