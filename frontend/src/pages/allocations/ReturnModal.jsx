/**
 * ReturnModal — Part of Screen 5
 *
 * Allows an employee/Asset Manager to initiate an asset return.
 * Condition notes are required (Asset Manager will review on backend).
 */

import { useState } from 'react'
import { returnAsset } from '../../services/allocations'

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

export default function ReturnModal({ allocation, onClose, onSuccess }) {
  const [conditionNotes, setConditionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!conditionNotes.trim()) {
      setError('Condition notes are required before returning an asset.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await returnAsset(allocation.id, { conditionNotes: conditionNotes.trim() })
      onSuccess()
      onClose()
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
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Return Asset</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              {allocation.asset?.asset_tag} — {allocation.asset?.name ?? 'Asset'}
            </p>
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

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Info banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
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
              Condition notes are required and will be reviewed by the Asset Manager during check-in.
            </p>
          </div>

          {/* Condition notes */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="return-condition-notes"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Condition Notes <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              id="return-condition-notes"
              rows={4}
              value={conditionNotes}
              onChange={e => { setConditionNotes(e.target.value); setError(null) }}
              placeholder="Describe the current condition of the asset. Note any damage, wear, or issues found…"
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {conditionNotes.length} characters
            </p>
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
              id="btn-confirm-return"
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--success)',
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
