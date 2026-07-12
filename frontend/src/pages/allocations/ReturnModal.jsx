/**
 * ReturnModal — Part of Screen 5
 *
 * Allows an employee/Asset Manager to initiate an asset return.
 * Condition notes are required (Asset Manager will review on backend).
 */

import { useState } from 'react'
import { returnAsset } from '../../services/allocations'

const inputCls =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 ' +
  'placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white">Return Asset</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {allocation.asset?.asset_tag} — {allocation.asset?.name ?? 'Asset'}
            </p>
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-300">
              Condition notes are required and will be reviewed by the Asset Manager during check-in.
            </p>
          </div>

          {/* Condition notes */}
          <div className="space-y-1.5">
            <label htmlFor="return-condition-notes" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Condition Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              id="return-condition-notes"
              rows={4}
              value={conditionNotes}
              onChange={e => { setConditionNotes(e.target.value); setError(null) }}
              placeholder="Describe the current condition of the asset. Note any damage, wear, or issues found…"
              className={`${inputCls} resize-none`}
            />
            <p className="text-xs text-gray-600">
              {conditionNotes.length} characters
            </p>
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
              id="btn-confirm-return"
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Submitting…' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
