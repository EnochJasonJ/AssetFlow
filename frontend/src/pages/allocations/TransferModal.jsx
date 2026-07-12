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

const inputCls =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 ' +
  'placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white">Request Transfer</h2>
            {assetTag && <p className="text-xs text-gray-500 mt-0.5">{assetTag} — {assetName}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Success state */}
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-300 font-medium">Transfer request submitted!</p>
              <p className="text-xs text-gray-500">
                An Asset Manager or Department Head will review and approve it.
              </p>
              <button
                onClick={() => { onSuccess(); onClose() }}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Current holder info */}
              {currentHolder && (
                <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center text-xs font-bold shrink-0">
                    {(currentHolder.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-300">Currently held by</p>
                    <p className="text-sm text-white font-medium">{currentHolder.name ?? '—'}</p>
                    {currentHolder.email && <p className="text-xs text-gray-500">{currentHolder.email}</p>}
                  </div>
                </div>
              )}

              {/* Transfer flow explanation */}
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-300">
                  Transfer flow: <strong>Requested → Approved</strong> (by Asset Manager / Dept Head) → Re-allocated to you.
                </p>
              </div>

              {/* Reason input */}
              <div className="space-y-1.5">
                <label htmlFor="transfer-reason" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Reason for Transfer <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="transfer-reason"
                  rows={3}
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError(null) }}
                  placeholder="Explain why you need this asset…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {error}
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
                  id="btn-submit-transfer"
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
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
