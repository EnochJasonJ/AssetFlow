/**
 * CardActionModal — Part of Screen 7
 *
 * Handles all card-level actions on maintenance requests:
 *   approve, reject, assign (technician), inprogress, resolve
 *
 * The appropriate form is rendered based on the `action` prop.
 * Calls updateStatus service and refreshes the Kanban on success.
 */

import { useState } from 'react'
import { updateStatus } from '../../services/maintenance'

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

// Maps action key → { title, confirmLabel, confirmStyle, nextStatus, needsTechnician }
const ACTION_CONFIG = {
  approve: {
    title: 'Approve Maintenance Request',
    description: 'Approving will flip the asset status to Under Maintenance.',
    confirmLabel: 'Approve',
    confirmStyle: { background: '#2563eb' },
    confirmHoverStyle: { background: '#1d4ed8' },
    nextStatus: 'Approved',
  },
  reject: {
    title: 'Reject Maintenance Request',
    description: 'Rejecting this request will not change the asset status.',
    confirmLabel: 'Reject',
    confirmStyle: { background: '#dc2626' },
    confirmHoverStyle: { background: '#b91c1c' },
    nextStatus: 'Rejected',
  },
  assign: {
    title: 'Assign Technician',
    description: 'Enter the name of the technician who will handle this request.',
    confirmLabel: 'Assign',
    confirmStyle: { background: '#4f46e5' },
    confirmHoverStyle: { background: '#4338ca' },
    nextStatus: 'TechnicianAssigned',
    needsTechnician: true,
  },
  inprogress: {
    title: 'Mark In Progress',
    description: 'Mark this request as actively in progress.',
    confirmLabel: 'Mark In Progress',
    confirmStyle: { background: '#ea580c' },
    confirmHoverStyle: { background: '#c2410c' },
    nextStatus: 'InProgress',
  },
  resolve: {
    title: 'Mark as Resolved',
    description: 'Resolving will revert the asset status back to Available (or Allocated if it was held).',
    confirmLabel: 'Mark Resolved',
    confirmStyle: { background: '#059669' },
    confirmHoverStyle: { background: '#047857' },
    nextStatus: 'Resolved',
  },
}

export default function CardActionModal({ request, action, onClose, onSuccess }) {
  const config = ACTION_CONFIG[action]
  const [technicianName, setTechnicianName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [confirmHovered, setConfirmHovered] = useState(false)

  if (!config) {
    return null
  }

  async function handleConfirm() {
    if (config.needsTechnician && !technicianName.trim()) {
      setError('Technician name is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await updateStatus(request.id, {
        status: config.nextStatus,
        technicianName: technicianName.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmBg = confirmHovered && !submitting
    ? config.confirmHoverStyle.background
    : config.confirmStyle.background

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e2e6ec' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{config.title}</h2>
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

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Asset info */}
          <div style={{ padding: '0.75rem', background: '#f4f6f9', borderRadius: '10px', border: '1px solid #e2e6ec' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>Asset</p>
            <p style={{ margin: '0.125rem 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{request.asset?.name ?? 'Unknown'}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#4f46e5', fontFamily: 'monospace' }}>{request.asset?.asset_tag}</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#9ca3af', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{request.issue_description}</p>
          </div>

          {/* Description / warning */}
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563' }}>{config.description}</p>

          {/* Technician input (assign action only) */}
          {config.needsTechnician && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label htmlFor="assign-technician-name" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Technician Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="assign-technician-name"
                type="text"
                value={technicianName}
                onChange={e => { setTechnicianName(e.target.value); setError(null) }}
                placeholder="Full name of technician…"
                style={inputStyle}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626', padding: '0.75rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px' }}>
              {error}
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
              id={`btn-confirm-${action}`}
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '0.625rem',
                background: confirmBg,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={() => setConfirmHovered(true)}
              onMouseLeave={() => setConfirmHovered(false)}
            >
              {submitting ? 'Processing…' : config.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
