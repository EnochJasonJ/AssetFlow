/**
 * TransferModal — Part of Screen 5
 *
 * Allows requesting a transfer for an asset currently held by someone else.
 * Can be opened from:
 *   1. The "Transfer" button on an active allocation row
 *   2. The "Request Transfer Instead" button in AllocateModal (409 conflict flow)
 *
 * Shows conflict info (who currently holds it) if available.
 */

import { useState } from 'react'
import { requestTransfer } from '../../services/allocations'

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
  resize: 'none',
}

export default function TransferModal({ allocation, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  // allocation may have a _conflict field when opened from 409 conflict flow
  const conflict = allocation._conflict ?? null
  const assetId = allocation.asset?.id ?? allocation.asset_id
  const assetTag = allocation.asset?.asset_tag
  const assetName = allocation.asset?.name ?? 'Asset'
  const currentHolder = conflict?.held_by ?? allocation.employee

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please explain why you need this asset.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await requestTransfer({ assetId, reason: reason.trim() })
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
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
          maxWidth: '448px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
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
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Request Transfer</h2>
            {assetTag && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>{assetTag} — {assetName}</p>}
          </div>
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

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Success state */}
          {submitted ? (
            <div style={{ textAlign: 'center', paddingTop: '24px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(5,150,105,0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>Transfer request submitted!</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                An Asset Manager or Department Head will review and approve it.
              </p>
              <button
                onClick={() => { onSuccess(); onClose() }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Current holder info */}
              {currentHolder && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent-glow)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(currentHolder.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 2px' }}>Currently held by</p>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{currentHolder.name ?? '—'}</p>
                    {currentHolder.email && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>{currentHolder.email}</p>}
                  </div>
                </div>
              )}

              {/* Transfer flow explanation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '12px',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <svg width="16" height="16" style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ fontSize: '12px', color: '#93c5fd', margin: 0 }}>
                  Transfer flow: <strong>Requested → Approved</strong> (by Asset Manager / Dept Head) → Re-allocated to you.
                </p>
              </div>

              {/* Reason input */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  htmlFor="transfer-reason"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Reason for Transfer <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  id="transfer-reason"
                  rows={3}
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError(null) }}
                  placeholder="Explain why you need this asset…"
                  style={inputStyle}
                />
              </div>

              {/* Error */}
              {error && (
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
                  {error}
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
                  id="btn-submit-transfer"
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Submitting…' : 'Request Transfer'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
