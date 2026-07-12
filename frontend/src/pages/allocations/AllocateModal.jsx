/**
 * AllocateModal — Part of Screen 5
 *
 * Form to allocate an asset to an employee or department.
 * Handles 409 conflict: shows WHO currently holds the asset and offers
 * a "Request Transfer Instead" button — never shows a generic error.
 */

import { useState, useEffect } from 'react'
import { allocateAsset } from '../../services/allocations'

/** Simple form input wrapper */
function Field({ label, htmlFor, children, required }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 ' +
  'placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors'

export default function AllocateModal({ onClose, onSuccess, onRequestTransfer }) {
  const [assets, setAssets] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loadingDeps, setLoadingDeps] = useState(true)

  const [form, setForm] = useState({
    assetId: '',
    assignedToUserId: '',
    assignedToDepartmentId: '',
    expectedReturnDate: '',
    assignType: 'employee', // 'employee' | 'department'
  })
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Conflict state — set when API returns 409
  const [conflict, setConflict] = useState(null) // { held_by: { name, email }, ... }

  // Load available assets, employees, departments from backend
  useEffect(() => {
    let cancelled = false

    async function loadDeps() {
      try {
        const [assetsRes, empRes, deptRes] = await Promise.all([
          fetch('/api/v1/assets?status=Available'),
          fetch('/api/v1/users'),
          fetch('/api/v1/departments'),
        ])

        if (!cancelled) {
          setAssets(assetsRes.ok ? await assetsRes.json() : [])
          setEmployees(empRes.ok ? await empRes.json() : [])
          setDepartments(deptRes.ok ? await deptRes.json() : [])
        }
      } catch {
        // Silently degrade — user can still type IDs manually
      } finally {
        if (!cancelled) setLoadingDeps(false)
      }
    }

    loadDeps()
    return () => { cancelled = true }
  }, [])

  function validate() {
    const errs = {}
    if (!form.assetId.trim()) errs.assetId = 'Asset is required'
    if (form.assignType === 'employee' && !form.assignedToUserId.trim()) errs.assignedToUserId = 'Employee is required'
    if (form.assignType === 'department' && !form.assignedToDepartmentId.trim()) errs.assignedToDepartmentId = 'Department is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSubmitting(true)
    setFieldErrors({})
    setConflict(null)

    try {
      await allocateAsset({
        assetId: form.assetId,
        assignedToUserId: form.assignType === 'employee' ? form.assignedToUserId : null,
        assignedToDepartmentId: form.assignType === 'department' ? form.assignedToDepartmentId : null,
        expectedReturnDate: form.expectedReturnDate || null,
      })
      onSuccess()
      onClose()
    } catch (err) {
      if (err.status === 409) {
        // Show conflict info — do NOT show generic error
        setConflict(err.conflict)
      } else {
        setFieldErrors({ submit: err.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleTransferInstead() {
    // Pass the selected asset + conflict info up to parent
    // so it can open the Transfer modal pre-filled
    onRequestTransfer({ assetId: form.assetId, conflict })
    onClose()
  }

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: undefined }))
    setConflict(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Allocate Asset</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── 409 Conflict banner ── */}
          {conflict && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-300">Asset Already Allocated</p>
                  <p className="text-sm text-amber-200/80 mt-1">
                    This asset is currently held by{' '}
                    <span className="font-semibold text-amber-300">
                      {conflict.held_by?.name ?? 'someone'}
                    </span>
                    {conflict.held_by?.email ? ` (${conflict.held_by.email})` : ''}
                    .
                  </p>
                  {conflict.allocated_since && (
                    <p className="text-xs text-amber-200/60 mt-1">
                      Since {new Date(conflict.allocated_since).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <button
                id="btn-request-transfer-instead"
                type="button"
                onClick={handleTransferInstead}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-bold rounded-lg transition-colors"
              >
                Request Transfer Instead
              </button>
            </div>
          )}

          {/* ── Form ── */}
          {!conflict && (
            <form id="form-allocate-asset" onSubmit={handleSubmit} className="space-y-4">

              {/* Asset picker */}
              <Field label="Asset" htmlFor="allocate-asset-id" required>
                {loadingDeps ? (
                  <div className={`${inputCls} text-gray-500`}>Loading assets…</div>
                ) : assets.length > 0 ? (
                  <select
                    id="allocate-asset-id"
                    value={form.assetId}
                    onChange={e => set('assetId', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select an available asset…</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.asset_tag} — {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="allocate-asset-id"
                    type="text"
                    value={form.assetId}
                    onChange={e => set('assetId', e.target.value)}
                    placeholder="Paste asset ID"
                    className={inputCls}
                  />
                )}
                {fieldErrors.assetId && <p className="text-xs text-red-400">{fieldErrors.assetId}</p>}
              </Field>

              {/* Assign type toggle */}
              <div className="flex gap-2">
                {['employee', 'department'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('assignType', t)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors capitalize ${
                      form.assignType === t
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {t === 'employee' ? 'Assign to Employee' : 'Assign to Department'}
                  </button>
                ))}
              </div>

              {/* Employee or department picker */}
              {form.assignType === 'employee' ? (
                <Field label="Employee" htmlFor="allocate-employee-id" required>
                  {employees.length > 0 ? (
                    <select
                      id="allocate-employee-id"
                      value={form.assignedToUserId}
                      onChange={e => set('assignedToUserId', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select an employee…</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} — {emp.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="allocate-employee-id"
                      type="text"
                      value={form.assignedToUserId}
                      onChange={e => set('assignedToUserId', e.target.value)}
                      placeholder="Paste employee ID"
                      className={inputCls}
                    />
                  )}
                  {fieldErrors.assignedToUserId && <p className="text-xs text-red-400">{fieldErrors.assignedToUserId}</p>}
                </Field>
              ) : (
                <Field label="Department" htmlFor="allocate-department-id" required>
                  {departments.length > 0 ? (
                    <select
                      id="allocate-department-id"
                      value={form.assignedToDepartmentId}
                      onChange={e => set('assignedToDepartmentId', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select a department…</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="allocate-department-id"
                      type="text"
                      value={form.assignedToDepartmentId}
                      onChange={e => set('assignedToDepartmentId', e.target.value)}
                      placeholder="Paste department ID"
                      className={inputCls}
                    />
                  )}
                  {fieldErrors.assignedToDepartmentId && <p className="text-xs text-red-400">{fieldErrors.assignedToDepartmentId}</p>}
                </Field>
              )}

              {/* Expected return date (optional) */}
              <Field label="Expected Return Date" htmlFor="allocate-return-date">
                <input
                  id="allocate-return-date"
                  type="date"
                  value={form.expectedReturnDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('expectedReturnDate', e.target.value)}
                  className={inputCls}
                />
              </Field>

              {/* Submit error */}
              {fieldErrors.submit && (
                <p className="text-sm text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {fieldErrors.submit}
                </p>
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
                  id="btn-submit-allocate"
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {submitting ? 'Allocating…' : 'Allocate Asset'}
                </button>
              </div>
            </form>
          )}

          {/* When conflict shown, offer Cancel */}
          {conflict && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
