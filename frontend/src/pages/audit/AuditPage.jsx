/**
 * AuditPage — Screen 8: Asset Audit
 *
 * Layout:
 *   - Header with "Create Audit Cycle" button
 *   - Cycle list: shows all Open + Closed cycles with scope, date, auditors
 *   - Click a cycle → opens detail view (checklist + discrepancy report + close)
 *
 * Detail view (Parts 10–11):
 *   - Per-asset checklist (Pending / Verified / Missing / Damaged)
 *   - Auto-generated discrepancy report (Missing + Damaged items)
 *   - Close Cycle button (irreversible — fires ConfirmDialog)
 *
 * Business rules (PRODUCT_CONTEXT §9):
 *   - Closing locks the cycle AND updates Missing → Lost atomically (server-side)
 *   - Only Open cycles accept item updates
 */

import { useState, useEffect, useCallback } from 'react'
import { getAuditCycles, createAuditCycle, closeAuditCycle } from '../../services/audit'
import AuditChecklist from './AuditChecklist'

/* ─── Helpers ────────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CycleBadge({ status }) {
  const styles = {
    Open:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Closed: 'bg-gray-500/15   text-gray-500   border-gray-700',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] ?? styles.Closed}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Open' ? 'bg-emerald-400' : 'bg-gray-500'}`} />
      {status}
    </span>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */

export default function AuditPage() {
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCycleId, setSelectedCycleId] = useState(null)

  const selectedCycle = cycles.find(c => c.id === selectedCycleId) ?? null

  const loadCycles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAuditCycles()
      setCycles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCycles() }, [loadCycles])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Page header ── */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Asset Audit</h1>
            <p className="text-sm text-gray-400 mt-0.5">Create and manage audit cycles, verify assets, close with discrepancy report</p>
          </div>
          <button
            id="btn-create-audit-cycle"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Audit Cycle
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
            <button onClick={loadCycles} className="ml-auto underline">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left panel: Cycle list ── */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">Audit Cycles</h2>

            {loading && (
              <div className="flex items-center justify-center py-10 text-gray-600 text-sm">
                <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading…
              </div>
            )}

            {!loading && cycles.length === 0 && (
              <div className="text-center py-10 text-gray-600 text-sm">
                No audit cycles yet. Create one to get started.
              </div>
            )}

            {!loading && cycles.map(cycle => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                selected={cycle.id === selectedCycleId}
                onClick={() => setSelectedCycleId(cycle.id === selectedCycleId ? null : cycle.id)}
              />
            ))}
          </div>

          {/* ── Right panel: Cycle detail ── */}
          <div className="lg:col-span-2">
            {!selectedCycle ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-600 border border-dashed border-gray-800 rounded-2xl">
                <svg className="w-8 h-8 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-sm">Select an audit cycle to view details</p>
                <p className="text-xs mt-1 text-gray-700">or create a new cycle</p>
              </div>
            ) : (
              <CycleDetail
                cycle={selectedCycle}
                onCycleUpdate={loadCycles}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateAuditCycleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadCycles}
        />
      )}
    </div>
  )
}

/* ─── Cycle card (left panel) ────────────────────────────────── */

function CycleCard({ cycle, selected, onClick }) {
  const auditorCount = cycle.auditors?.length ?? 0
  return (
    <button
      id={`cycle-card-${cycle.id}`}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-violet-600/10 border-violet-500/50 shadow-lg shadow-violet-500/5'
          : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-900/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-white truncate flex-1">
          {cycle.name ?? `Audit Cycle ${fmtDate(cycle.start_date)}`}
        </p>
        <CycleBadge status={cycle.status} />
      </div>

      {/* Scope */}
      <div className="space-y-1">
        {cycle.scope_department?.name && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {cycle.scope_department.name}
          </div>
        )}
        {cycle.scope_location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {cycle.scope_location}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {fmtDate(cycle.start_date)} – {fmtDate(cycle.end_date)}
        </div>
      </div>

      {/* Auditors count */}
      {auditorCount > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {auditorCount} auditor{auditorCount !== 1 ? 's' : ''}
        </div>
      )}
    </button>
  )
}

/* ─── Cycle detail panel (right) — placeholder for Parts 10-11 ── */

function CycleDetail({ cycle, onCycleUpdate }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeResult, setCloseResult] = useState(null) // discrepancy summary
  const [closeError, setCloseError] = useState(null)

  async function handleClose() {
    setClosing(true)
    setCloseError(null)
    try {
      const result = await closeAuditCycle(cycle.id)
      setCloseResult(result)
      setShowConfirm(false)
      onCycleUpdate() // refresh cycle list to show Closed status
    } catch (err) {
      setCloseError(err.message)
      setShowConfirm(false)
    } finally {
      setClosing(false)
    }
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Cycle header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">
              {cycle.name ?? `Audit — ${fmtDate(cycle.start_date)}`}
            </h2>
            <CycleBadge status={cycle.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {fmtDate(cycle.start_date)} – {fmtDate(cycle.end_date)}
            {cycle.scope_department?.name ? ` · ${cycle.scope_department.name}` : ''}
            {cycle.scope_location ? ` · ${cycle.scope_location}` : ''}
          </p>
        </div>

        {/* Close Cycle button — only for Open cycles */}
        {cycle.status === 'Open' && (
          <button
            id={`btn-close-cycle-${cycle.id}`}
            onClick={() => setShowConfirm(true)}
            disabled={closing}
            className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Close Cycle
          </button>
        )}
      </div>


      {/* Auditors */}
      {cycle.auditors?.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-600">Auditors:</span>
          {cycle.auditors.map(a => (
            <span key={a.id} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded-full">
              {a.name}
            </span>
          ))}
        </div>
      )}

      {/* Checklist & discrepancy report */}
      <div className="px-6 py-6">
        {/* Close error */}
        {closeError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            Failed to close cycle: {closeError}
          </div>
        )}

        {/* Post-close summary */}
        {closeResult && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-emerald-300">Audit Cycle Closed</p>
            <p className="text-xs text-emerald-400">
              {closeResult.missing_count ?? 0} Missing → marked Lost &nbsp;·&nbsp;
              {closeResult.damaged_count ?? 0} Damaged recorded
            </p>
          </div>
        )}

        <AuditChecklist cycleId={cycle.id} isOpen={cycle.status === 'Open'} />
      </div>

      {/* Irreversible Confirm Dialog */}
      {showConfirm && (
        <CloseCycleConfirmDialog
          cycleName={cycle.name ?? `Audit ${cycle.id.slice(0, 8)}`}
          onConfirm={handleClose}
          onCancel={() => setShowConfirm(false)}
          closing={closing}
        />
      )}
    </div>
  )
}

/* ─── Create Audit Cycle Modal ───────────────────────────────── */

function CreateAuditCycleModal({ onClose, onSuccess }) {
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loadingDeps, setLoadingDeps] = useState(true)

  const [form, setForm] = useState({
    scopeDepartmentId: '',
    scopeLocation: '',
    startDate: '',
    endDate: '',
    auditorIds: [],
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/v1/departments').then(r => r.ok ? r.json() : []),
      fetch('/api/v1/users').then(r => r.ok ? r.json() : []),
    ])
      .then(([depts, emps]) => {
        if (!cancelled) { setDepartments(depts); setEmployees(emps) }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDeps(false) })
    return () => { cancelled = true }
  }, [])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function toggleAuditor(id) {
    setForm(prev => ({
      ...prev,
      auditorIds: prev.auditorIds.includes(id)
        ? prev.auditorIds.filter(a => a !== id)
        : [...prev.auditorIds, id],
    }))
  }

  function validate() {
    const errs = {}
    if (!form.startDate) errs.startDate = 'Start date is required'
    if (!form.endDate) errs.endDate = 'End date is required'
    if (form.startDate && form.endDate && form.startDate > form.endDate) errs.endDate = 'End date must be after start date'
    if (!form.scopeDepartmentId && !form.scopeLocation.trim()) {
      errs.scope = 'Provide at least a department or location scope'
    }
    if (form.auditorIds.length === 0) errs.auditorIds = 'Assign at least one auditor'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setErrors({})
    try {
      await createAuditCycle({
        scopeDepartmentId: form.scopeDepartmentId || null,
        scopeLocation: form.scopeLocation.trim() || null,
        startDate: form.startDate,
        endDate: form.endDate,
        auditorIds: form.auditorIds,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 ' +
    'placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Create Audit Cycle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Scope — department */}
          <div className="space-y-1.5">
            <label htmlFor="audit-scope-dept" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Scope — Department
            </label>
            {departments.length > 0 ? (
              <select
                id="audit-scope-dept"
                value={form.scopeDepartmentId}
                onChange={e => set('scopeDepartmentId', e.target.value)}
                className={inputCls}
              >
                <option value="">All departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            ) : (
              <input
                id="audit-scope-dept"
                type="text"
                value={form.scopeDepartmentId}
                onChange={e => set('scopeDepartmentId', e.target.value)}
                placeholder="Department ID (optional)"
                className={inputCls}
              />
            )}
          </div>

          {/* Scope — location */}
          <div className="space-y-1.5">
            <label htmlFor="audit-scope-location" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Scope — Location
            </label>
            <input
              id="audit-scope-location"
              type="text"
              value={form.scopeLocation}
              onChange={e => set('scopeLocation', e.target.value)}
              placeholder="e.g. HQ - Floor 2 (optional)"
              className={inputCls}
            />
          </div>
          {errors.scope && <p className="text-xs text-red-400">{errors.scope}</p>}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="audit-start-date" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                id="audit-start-date"
                type="date"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
                className={inputCls}
              />
              {errors.startDate && <p className="text-xs text-red-400">{errors.startDate}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="audit-end-date" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                End Date <span className="text-red-400">*</span>
              </label>
              <input
                id="audit-end-date"
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={e => set('endDate', e.target.value)}
                className={inputCls}
              />
              {errors.endDate && <p className="text-xs text-red-400">{errors.endDate}</p>}
            </div>
          </div>

          {/* Auditors multi-select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Assign Auditors <span className="text-red-400">*</span>
            </label>
            {loadingDeps ? (
              <p className="text-xs text-gray-500">Loading employees…</p>
            ) : employees.length === 0 ? (
              <p className="text-xs text-gray-500">No employees found</p>
            ) : (
              <div className="max-h-40 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg divide-y divide-gray-700/50">
                {employees.map(emp => {
                  const checked = form.auditorIds.includes(emp.id)
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        checked ? 'bg-violet-600/10' : 'hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`auditor-${emp.id}`}
                        checked={checked}
                        onChange={() => toggleAuditor(emp.id)}
                        className="w-3.5 h-3.5 rounded accent-violet-500"
                      />
                      <div>
                        <p className="text-sm text-gray-200">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.email}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
            {form.auditorIds.length > 0 && (
              <p className="text-xs text-violet-400">{form.auditorIds.length} auditor{form.auditorIds.length !== 1 ? 's' : ''} selected</p>
            )}
            {errors.auditorIds && <p className="text-xs text-red-400">{errors.auditorIds}</p>}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">{errors.submit}</p>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-audit"
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Creating…' : 'Create Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Close Cycle Confirm Dialog ─────────────────────────────── */

/**
 * CloseCycleConfirmDialog
 *
 * Irreversible action warning shown before closing an audit cycle.
 * Closing: locks the cycle + transitions all Missing assets to Lost (server-side, atomic).
 * Show this ALWAYS before calling closeAuditCycle.
 */
function CloseCycleConfirmDialog({ cycleName, onConfirm, onCancel, closing }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10">

        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4 text-center">
          <div>
            <h2 className="text-base font-bold text-white">Close Audit Cycle?</h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">{cycleName}</p>
          </div>

          <div className="text-left space-y-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">This action is irreversible</p>
            <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
              <li>The cycle will be permanently <strong>locked</strong> — no further edits</li>
              <li>All <strong>Missing</strong> assets will be marked as <strong>Lost</strong></li>
              <li>Asset status updates happen atomically in one transaction</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500">
            Make sure all auditors have completed their verification before closing.
          </p>

          <div className="flex gap-3">
            <button
              id="btn-cancel-close-cycle"
              type="button"
              onClick={onCancel}
              disabled={closing}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-close-cycle"
              type="button"
              onClick={onConfirm}
              disabled={closing}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
            >
              {closing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Closing…
                </span>
              ) : 'Yes, Close Cycle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
