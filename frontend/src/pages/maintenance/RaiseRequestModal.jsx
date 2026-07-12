/**
 * RaiseRequestModal — Part of Screen 7
 *
 * Any user (Employee / Asset Manager / etc.) can raise a maintenance request.
 * Asset stays at current status until an Asset Manager APPROVES the request.
 */

import { useState, useEffect } from 'react'
import { raiseRequest } from '../../services/maintenance'
import { getAssets } from '../../services/assets'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const PRIORITY_STYLES = {
  Low:      { background: 'rgba(16,185,129,0.1)',  color: '#059669', border: '1px solid #059669' },
  Medium:   { background: 'rgba(217,119,6,0.1)',   color: '#d97706', border: '1px solid #d97706' },
  High:     { background: 'rgba(249,115,22,0.1)',  color: '#ea580c', border: '1px solid #ea580c' },
  Critical: { background: 'rgba(220,38,38,0.1)',   color: '#dc2626', border: '1px solid #dc2626' },
}

const PRIORITY_IDLE = {
  background: '#f4f6f9',
  color: '#9ca3af',
  border: '1px solid #e2e6ec',
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: '#f4f6f9',
  border: '1px solid #e2e6ec',
  borderRadius: '8px',
  fontSize: '0.875rem',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default function RaiseRequestModal({ onClose, onSuccess }) {
  const [assets, setAssets] = useState([])
  const [loadingAssets, setLoadingAssets] = useState(true)

  const [form, setForm] = useState({
    assetId: '',
    issueDescription: '',
    priority: 'Medium',
    photoUrl: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Load all assets (not just Available — can raise on Allocated/UnderMaintenance too)
  useEffect(() => {
    let cancelled = false
    getAssets()
      .then(data => { if (!cancelled) setAssets(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingAssets(false) })
    return () => { cancelled = true }
  }, [])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.assetId.trim()) errs.assetId = 'Asset is required'
    if (!form.issueDescription.trim()) errs.issueDescription = 'Issue description is required'
    if (form.issueDescription.trim().length < 10) errs.issueDescription = 'Please describe the issue in more detail (min 10 chars)'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setErrors({})
    try {
      await raiseRequest({
        assetId: form.assetId,
        issueDescription: form.issueDescription.trim(),
        priority: form.priority,
        photoUrl: form.photoUrl.trim() || null,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }}>
      <div className="card" style={{ maxWidth: 520, width: '100%', padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e6ec', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Raise Maintenance Request</h2>
          <button
            onClick={onClose}
            style={{ padding: '0.375rem', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f4f6f9'; e.currentTarget.style.color = '#111827' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
          >
            <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Asset picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label htmlFor="raise-asset-id" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Asset <span style={{ color: '#dc2626' }}>*</span>
            </label>
            {loadingAssets ? (
              <div style={{ ...inputStyle, color: '#9ca3af' }}>Loading assets…</div>
            ) : (
              <select
                id="raise-asset-id"
                value={form.assetId}
                onChange={e => set('assetId', e.target.value)}
                style={inputStyle}
              >
                <option value="">Select asset…</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.asset_tag} — {a.name} ({a.status || 'Available'})
                  </option>
                ))}
              </select>
            )}
            {errors.assetId && <p style={{ margin: 0, fontSize: '0.75rem', color: '#dc2626' }}>{errors.assetId}</p>}
          </div>

          {/* Issue description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label htmlFor="raise-issue" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Issue Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="raise-issue"
              rows={3}
              value={form.issueDescription}
              onChange={e => set('issueDescription', e.target.value)}
              placeholder="Describe the issue in detail — what is wrong, when did it start, what impact does it have…"
              style={{ ...inputStyle, resize: 'none' }}
            />
            {errors.issueDescription && <p style={{ margin: 0, fontSize: '0.75rem', color: '#dc2626' }}>{errors.issueDescription}</p>}
          </div>

          {/* Priority selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {PRIORITIES.map(p => {
                const active = form.priority === p
                const s = active ? PRIORITY_STYLES[p] : PRIORITY_IDLE
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('priority', p)}
                    style={{
                      padding: '0.5rem 0',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: s.border,
                      background: s.background,
                      color: s.color,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Photo URL (optional) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label htmlFor="raise-photo-url" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Photo URL <span style={{ color: '#9ca3af', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
            </label>
            <input
              id="raise-photo-url"
              type="url"
              value={form.photoUrl}
              onChange={e => set('photoUrl', e.target.value)}
              placeholder="https://…"
              style={inputStyle}
            />
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626', padding: '0.75rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px' }}>
              {errors.submit}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '0.625rem', background: '#f4f6f9', border: '1px solid #e2e6ec', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e6ec'; e.currentTarget.style.color = '#111827' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f4f6f9'; e.currentTarget.style.color = '#4b5563' }}
            >
              Cancel
            </button>
            <button
              id="btn-submit-raise-request"
              type="submit"
              disabled={submitting}
              style={{ flex: 1, padding: '0.625rem', background: '#4f46e5', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#ffffff', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1, transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#4338ca' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#4f46e5' }}
            >
              {submitting ? 'Submitting…' : 'Raise Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
