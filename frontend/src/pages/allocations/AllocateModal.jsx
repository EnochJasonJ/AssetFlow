/**
 * AllocateModal — Part of Screen 5
 *
 * Form to allocate an asset to an employee or department.
 * Handles 409 conflict: shows WHO currently holds the asset and offers
 * a "Request Transfer Instead" button — never shows a generic error.
 */

import { useState, useEffect } from 'react'
import { allocateAsset } from '../../services/allocations'
import { getAssets, getDepartments, getUsers } from '../../services/assets'

/** Simple form input wrapper */
function Field({ label, htmlFor, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: '14px',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

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
        const [allAssets, allUsers, allDepts] = await Promise.all([
          getAssets(),
          getUsers(),
          getDepartments(),
        ])

        if (!cancelled) {
          setAssets(allAssets)
          setEmployees(allUsers)
          setDepartments(allDepts)
        }
      } catch {
        // Silently degrade
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
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="modal-box"
        style={{
          width: '100%',
          maxWidth: '512px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >

        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Allocate Asset</h2>
          <button
            className="modal-close"
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── 409 Conflict banner ── */}
          {conflict && (
            <div
              style={{
                padding: '16px',
                background: 'rgba(217,119,6,0.08)',
                border: '1px solid rgba(217,119,6,0.3)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg width="20" height="20" style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)', margin: '0 0 4px' }}>Asset Already Allocated</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    This asset is currently held by{' '}
                    <span style={{ fontWeight: 600, color: 'var(--warning)' }}>
                      {conflict.held_by?.name ?? 'someone'}
                    </span>
                    {conflict.held_by?.email ? ` (${conflict.held_by.email})` : ''}
                    .
                  </p>
                  {conflict.allocated_since && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Since {new Date(conflict.allocated_since).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <button
                id="btn-request-transfer-instead"
                type="button"
                onClick={handleTransferInstead}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--warning)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                Request Transfer Instead
              </button>
            </div>
          )}

          {/* ── Form ── */}
          {!conflict && (
            <form id="form-allocate-asset" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Asset picker */}
              <Field label="Asset" htmlFor="allocate-asset-id" required>
                {loadingDeps ? (
                  <div style={{ ...inputStyle, color: 'var(--text-muted)' }}>Loading assets…</div>
                ) : (
                  <select
                    id="allocate-asset-id"
                    value={form.assetId}
                    onChange={e => set('assetId', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select an asset…</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.asset_tag} — {a.name} ({a.status || 'Available'})
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.assetId && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: '2px 0 0' }}>{fieldErrors.assetId}</p>}
              </Field>

              {/* Assign type toggle */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['employee', 'department'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('assignType', t)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'background 0.15s, color 0.15s',
                      background: form.assignType === t ? 'var(--accent)' : 'var(--bg-base)',
                      color: form.assignType === t ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {t === 'employee' ? 'Assign to Employee' : 'Assign to Department'}
                  </button>
                ))}
              </div>

              {/* Employee or department picker */}
              {form.assignType === 'employee' ? (
                <Field label="Employee" htmlFor="allocate-employee-id" required>
                  <select
                    id="allocate-employee-id"
                    value={form.assignedToUserId}
                    onChange={e => set('assignedToUserId', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select an employee…</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.email}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.assignedToUserId && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: '2px 0 0' }}>{fieldErrors.assignedToUserId}</p>}
                </Field>
              ) : (
                <Field label="Department" htmlFor="allocate-department-id" required>
                  <select
                    id="allocate-department-id"
                    value={form.assignedToDepartmentId}
                    onChange={e => set('assignedToDepartmentId', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select a department…</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {fieldErrors.assignedToDepartmentId && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: '2px 0 0' }}>{fieldErrors.assignedToDepartmentId}</p>}
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
                  style={inputStyle}
                />
              </Field>

              {/* Submit error */}
              {fieldErrors.submit && (
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--danger)',
                    padding: '12px',
                    background: 'rgba(220,38,38,0.08)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: 'var(--radius)',
                    margin: 0,
                  }}
                >
                  {fieldErrors.submit}
                </p>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-allocate"
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
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
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
