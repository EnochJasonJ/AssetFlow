// Screen 5 — Asset Allocation & Transfer
// Owner: Abinivas | UI fixed by Hari — wrapped in AppLayout + CSS variable system
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import StatusBadge from '../../components/shared/StatusBadge'
import { getAllocations } from '../../services/allocations'
import AllocateModal from './AllocateModal'
import ReturnModal from './ReturnModal'
import TransferModal from './TransferModal'

function isOverdue(a) {
  if (a.status !== 'Active') return false
  if (!a.expected_return_date) return false
  return new Date(a.expected_return_date) < new Date()
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AllocationPage() {
  const [allocations, setAllocations] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [returnTarget, setReturnTarget]   = useState(null)
  const [transferTarget, setTransferTarget] = useState(null)

  const loadAllocations = useCallback(async () => {
    setLoading(true); setError(null)
    try { setAllocations(await getAllocations()) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAllocations() }, [loadAllocations])

  const overdueRows  = allocations.filter(a => isOverdue(a)).sort((a, b) => new Date(a.expected_return_date) - new Date(b.expected_return_date))
  const activeRows   = allocations.filter(a => a.status === 'Active' && !isOverdue(a))
  const returnedRows = allocations.filter(a => a.status === 'Returned')
  const orderedRows  = [...overdueRows, ...activeRows, ...returnedRows]
  const totalActive  = allocations.filter(a => a.status === 'Active').length
  const totalOverdue = overdueRows.length

  return (
    <AppLayout title="Allocation">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Asset Allocation & Transfer</h2>
          <p>Manage asset assignments, transfers, and returns.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAllocateModal(true)}>
          ＋ Allocate Asset
        </button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Active',    value: loading ? '…' : totalActive,            color: 'var(--success)' },
          { label: 'Overdue',         value: loading ? '…' : totalOverdue,           color: totalOverdue > 0 ? 'var(--danger)' : 'var(--text-muted)' },
          { label: 'All Allocations', value: loading ? '…' : allocations.length,     color: 'var(--accent)' },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue banner */}
      {!loading && totalOverdue > 0 && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          ⚠️ {totalOverdue} allocation{totalOverdue > 1 ? 's are' : ' is'} overdue — shown at the top of the table.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error} <button className="btn btn-sm btn-ghost" onClick={loadAllocations} style={{ marginLeft: '1rem' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Assigned To</th>
                <th>Department</th>
                <th>Allocated On</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              )}
              {!loading && orderedRows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No allocations yet.
                </td></tr>
              )}
              {!loading && orderedRows.map(a => {
                const overdue = isOverdue(a)
                return (
                  <tr key={a.id} style={overdue ? { background: 'rgba(239,68,68,0.06)' } : {}}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '0.8rem' }}>{a.asset?.asset_tag ?? '—'}</div>
                      <div style={{ fontWeight: 500 }}>{a.asset?.name ?? 'Unknown Asset'}</div>
                    </td>
                    <td>
                      <div>{a.assigned_to_user?.name ?? a.employee?.name ?? '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.assigned_to_user?.email ?? a.employee?.email ?? ''}</div>
                    </td>
                    <td>{a.assigned_to_department?.name ?? a.department?.name ?? '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(a.allocated_at)}</td>
                    <td style={{ fontSize: '0.8rem', color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: overdue ? 700 : 400 }}>
                      {fmtDate(a.expected_return_date)}
                      {overdue && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>⚠ OVERDUE</span>}
                    </td>
                    <td><StatusBadge status={overdue ? 'Overdue' : a.status} /></td>
                    <td>
                      {a.status === 'Returned'
                        ? <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Returned</span>
                        : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => setReturnTarget(a)}>Return</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setTransferTarget(a)}>Transfer</button>
                          </div>
                        )
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAllocateModal && (
        <AllocateModal
          onClose={() => setShowAllocateModal(false)}
          onSuccess={loadAllocations}
          onRequestTransfer={({ assetId, conflict }) => {
            setShowAllocateModal(false)
            setTransferTarget({ id: null, asset: { id: assetId }, _conflict: conflict })
          }}
        />
      )}
      {returnTarget   && <ReturnModal   allocation={returnTarget}   onClose={() => setReturnTarget(null)}   onSuccess={loadAllocations} />}
      {transferTarget && <TransferModal allocation={transferTarget} onClose={() => setTransferTarget(null)} onSuccess={loadAllocations} />}
    </AppLayout>
  )
}
