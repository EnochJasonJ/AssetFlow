// Screen 8 — Asset Audit
// Owner: Abinivas | UI fixed by Hari — wrapped in AppLayout + CSS variable system
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import { getAuditCycles, createAuditCycle, closeAuditCycle } from '../../services/audit'
import AuditChecklist from './AuditChecklist'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CycleBadge({ status }) {
  const isOpen = status === 'Open'
  return (
    <span style={{
      background: isOpen ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
      color: isOpen ? '#34d399' : '#9ca3af',
      border: `1px solid ${isOpen ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.3)'}`,
      borderRadius: 99, padding: '0.12rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOpen ? '#34d399' : '#9ca3af', display: 'inline-block' }} />
      {status}
    </span>
  )
}

/* ─── Cycle Card (left panel) ─────────────────────────── */
function CycleCard({ cycle, selected, onClick }) {
  return (
    <button
      id={`cycle-card-${cycle.id}`}
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '1rem', borderRadius: 10,
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'rgba(139,92,246,0.08)' : 'var(--bg-card)',
        cursor: 'pointer', transition: 'all 0.15s', display: 'block'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {cycle.name ?? `Audit — ${fmtDate(cycle.start_date)}`}
        </span>
        <CycleBadge status={cycle.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {cycle.scope_department?.name && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🏢 {cycle.scope_department.name}</span>}
        {cycle.scope_location && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {cycle.scope_location}</span>}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {fmtDate(cycle.start_date)} – {fmtDate(cycle.end_date)}</span>
        {cycle.auditors?.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>👥 {cycle.auditors.length} auditor{cycle.auditors.length !== 1 ? 's' : ''}</span>}
      </div>
      {/* Progress bar */}
      {cycle.total_items > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            <span>{cycle.verified ?? 0}/{cycle.total_items} verified</span>
            <span style={{ color: cycle.missing > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{cycle.missing ?? 0} missing</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((cycle.verified ?? 0) / cycle.total_items) * 100}%`, background: 'var(--success)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}
    </button>
  )
}

/* ─── Cycle Detail Panel (right) ─────────────────────── */
function CycleDetail({ cycle, onCycleUpdate }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [closing, setClosing]         = useState(false)
  const [closeResult, setCloseResult] = useState(null)
  const [closeError, setCloseError]   = useState(null)

  async function handleClose() {
    setClosing(true); setCloseError(null)
    try {
      const result = await closeAuditCycle(cycle.id)
      setCloseResult(result)
      setShowConfirm(false)
      onCycleUpdate()
    } catch (err) {
      setCloseError(err.message)
      setShowConfirm(false)
    } finally { setClosing(false) }
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      {/* Cycle header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0 }}>{cycle.name ?? `Audit — ${fmtDate(cycle.start_date)}`}</h3>
            <CycleBadge status={cycle.status} />
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {fmtDate(cycle.start_date)} – {fmtDate(cycle.end_date)}
            {cycle.scope_department?.name ? ` · ${cycle.scope_department.name}` : ''}
            {cycle.scope_location ? ` · ${cycle.scope_location}` : ''}
          </p>
        </div>
        {cycle.status === 'Open' && (
          <button
            id={`btn-close-cycle-${cycle.id}`}
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={() => setShowConfirm(true)}
            disabled={closing}
          >
            🔒 Close Cycle
          </button>
        )}
      </div>

      {/* Auditors */}
      {cycle.auditors?.length > 0 && (
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auditors:</span>
          {cycle.auditors.map((a, i) => (
            <span key={a.id ?? i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '0.15rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {a.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ padding: '1.5rem' }}>
        {closeError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>Failed to close: {closeError}</div>}
        {closeResult && (
          <div className="alert" style={{ marginBottom: '1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: 8, padding: '0.75rem 1rem' }}>
            ✅ Audit Cycle Closed — {closeResult.missing_count ?? 0} Missing → Lost · {closeResult.damaged_count ?? 0} Damaged recorded
          </div>
        )}
        <AuditChecklist cycleId={cycle.id} isOpen={cycle.status === 'Open'} />
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: 420, width: '100%', border: '1px solid rgba(239,68,68,0.4)' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem 1.5rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
              <h3 style={{ margin: '0 0 0.25rem' }}>Close Audit Cycle?</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{cycle.name ?? `Audit ${cycle.id.slice(0, 8)}`}</p>
            </div>
            <div style={{ margin: '1.25rem 1.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.9rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>This action is irreversible</p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'rgba(239,68,68,0.8)', lineHeight: 1.7 }}>
                <li>The cycle will be permanently <strong>locked</strong></li>
                <li>All <strong>Missing</strong> assets → marked as <strong>Lost</strong></li>
                <li>Asset status updates happen atomically</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', padding: '0 1.5rem 1.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfirm(false)} disabled={closing}>Cancel</button>
              <button id="btn-confirm-close-cycle" className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleClose} disabled={closing}>
                {closing ? 'Closing…' : 'Yes, Close Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Create Audit Cycle Modal ────────────────────────── */
function CreateAuditCycleModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ scopeDepartmentId: '', scopeLocation: '', startDate: '', endDate: '', auditorIds: [] })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const MOCK_EMPLOYEES = [
    { id: 'u1', name: 'Devipriya', email: 'devipriya@company.com' },
    { id: 'u2', name: 'Abinivas',  email: 'abinivas@company.com' },
    { id: 'u3', name: 'Hari',      email: 'hari@company.com' },
    { id: 'u4', name: 'Jason',     email: 'jason@company.com' },
  ]

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })) }
  function toggleAuditor(id) { setForm(p => ({ ...p, auditorIds: p.auditorIds.includes(id) ? p.auditorIds.filter(a => a !== id) : [...p.auditorIds, id] })) }

  function validate() {
    const e = {}
    if (!form.startDate) e.startDate = 'Required'
    if (!form.endDate)   e.endDate   = 'Required'
    if (form.startDate && form.endDate && form.startDate > form.endDate) e.endDate = 'Must be after start date'
    if (!form.scopeDepartmentId && !form.scopeLocation.trim()) e.scope = 'Provide at least a department or location'
    if (form.auditorIds.length === 0) e.auditorIds = 'Assign at least one auditor'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true); setErrors({})
    try {
      await createAuditCycle({ scopeDepartmentId: form.scopeDepartmentId || null, scopeLocation: form.scopeLocation.trim() || null, startDate: form.startDate, endDate: form.endDate, auditorIds: form.auditorIds })
      onSuccess(); onClose()
    } catch (err) { setErrors({ submit: err.message }) }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Create Audit Cycle</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Scope — Department</label>
              <input type="text" placeholder="e.g. Engineering (optional)" value={form.scopeDepartmentId} onChange={e => set('scopeDepartmentId', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Scope — Location</label>
              <input type="text" placeholder="e.g. Floor 2 (optional)" value={form.scopeLocation} onChange={e => set('scopeLocation', e.target.value)} />
            </div>
          </div>
          {errors.scope && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{errors.scope}</p>}

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              {errors.startDate && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>{errors.startDate}</p>}
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} />
              {errors.endDate && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>{errors.endDate}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>Assign Auditors *</label>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
              {MOCK_EMPLOYEES.map(emp => (
                <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', cursor: 'pointer', background: form.auditorIds.includes(emp.id) ? 'rgba(139,92,246,0.1)' : 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  <input type="checkbox" id={`auditor-${emp.id}`} checked={form.auditorIds.includes(emp.id)} onChange={() => toggleAuditor(emp.id)} style={{ width: 'auto' }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{emp.name}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp.email}</p>
                  </div>
                </label>
              ))}
            </div>
            {form.auditorIds.length > 0 && <p style={{ fontSize: '0.75rem', color: 'var(--accent)', margin: '0.3rem 0 0' }}>{form.auditorIds.length} auditor{form.auditorIds.length !== 1 ? 's' : ''} selected</p>}
            {errors.auditorIds && <p style={{ color: 'var(--danger)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>{errors.auditorIds}</p>}
          </div>

          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button id="btn-submit-create-audit" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────── */
export default function AuditPage() {
  const [cycles, setCycles]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCycleId, setSelectedCycleId] = useState(null)

  const selectedCycle = cycles.find(c => c.id === selectedCycleId) ?? null

  const loadCycles = useCallback(async () => {
    setLoading(true); setError(null)
    try { const data = await getAuditCycles(); setCycles(data); if (data.length > 0 && !selectedCycleId) setSelectedCycleId(data[0].id) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCycles() }, [loadCycles])

  return (
    <AppLayout title="Audit">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2>Asset Audit</h2>
          <p>Create and manage audit cycles, verify assets, and generate discrepancy reports.</p>
        </div>
        <button className="btn btn-primary" id="btn-create-audit-cycle" onClick={() => setShowCreateModal(true)}>
          ＋ Create Audit Cycle
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error} <button className="btn btn-sm btn-ghost" onClick={loadCycles} style={{ marginLeft: 8 }}>Retry</button></div>}

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left: Cycle list */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem 0.25rem' }}>Audit Cycles</p>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>}
          {!loading && cycles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No audit cycles yet. Create one to get started.</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {!loading && cycles.map(cycle => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                selected={cycle.id === selectedCycleId}
                onClick={() => setSelectedCycleId(cycle.id === selectedCycleId ? null : cycle.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Cycle detail */}
        <div>
          {!selectedCycle ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, border: '2px dashed var(--border)', borderRadius: 12, gap: '0.5rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem' }}>📋</div>
              <p style={{ margin: 0, fontWeight: 600 }}>Select an audit cycle</p>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>or create a new one</p>
            </div>
          ) : (
            <CycleDetail cycle={selectedCycle} onCycleUpdate={loadCycles} />
          )}
        </div>
      </div>

      {showCreateModal && <CreateAuditCycleModal onClose={() => setShowCreateModal(false)} onSuccess={loadCycles} />}
    </AppLayout>
  )
}
