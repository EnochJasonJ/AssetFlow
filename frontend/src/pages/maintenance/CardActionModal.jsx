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

const inputCls =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 ' +
  'placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors'

// Maps action key → { title, confirmLabel, confirmCls, nextStatus, needsTechnician }
const ACTION_CONFIG = {
  approve: {
    title: 'Approve Maintenance Request',
    description: 'Approving will flip the asset status to Under Maintenance.',
    confirmLabel: 'Approve',
    confirmCls: 'bg-blue-600 hover:bg-blue-500 text-white',
    nextStatus: 'Approved',
  },
  reject: {
    title: 'Reject Maintenance Request',
    description: 'Rejecting this request will not change the asset status.',
    confirmLabel: 'Reject',
    confirmCls: 'bg-red-600 hover:bg-red-500 text-white',
    nextStatus: 'Rejected',
  },
  assign: {
    title: 'Assign Technician',
    description: 'Enter the name of the technician who will handle this request.',
    confirmLabel: 'Assign',
    confirmCls: 'bg-violet-600 hover:bg-violet-500 text-white',
    nextStatus: 'TechnicianAssigned',
    needsTechnician: true,
  },
  inprogress: {
    title: 'Mark In Progress',
    description: 'Mark this request as actively in progress.',
    confirmLabel: 'Mark In Progress',
    confirmCls: 'bg-orange-600 hover:bg-orange-500 text-white',
    nextStatus: 'InProgress',
  },
  resolve: {
    title: 'Mark as Resolved',
    description: 'Resolving will revert the asset status back to Available (or Allocated if it was held).',
    confirmLabel: 'Mark Resolved',
    confirmCls: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    nextStatus: 'Resolved',
  },
}

export default function CardActionModal({ request, action, onClose, onSuccess }) {
  const config = ACTION_CONFIG[action]
  const [technicianName, setTechnicianName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">{config.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Asset info */}
          <div className="p-3 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500">Asset</p>
            <p className="text-sm font-semibold text-white mt-0.5">{request.asset?.name ?? 'Unknown'}</p>
            <p className="text-xs text-violet-400 font-mono">{request.asset?.asset_tag}</p>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{request.issue_description}</p>
          </div>

          {/* Description / warning */}
          <p className="text-sm text-gray-400">{config.description}</p>

          {/* Technician input (assign action only) */}
          {config.needsTechnician && (
            <div className="space-y-1.5">
              <label htmlFor="assign-technician-name" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Technician Name <span className="text-red-400">*</span>
              </label>
              <input
                id="assign-technician-name"
                type="text"
                value={technicianName}
                onChange={e => { setTechnicianName(e.target.value); setError(null) }}
                placeholder="Full name of technician…"
                className={inputCls}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</p>
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
              id={`btn-confirm-${action}`}
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className={`flex-1 py-2.5 disabled:opacity-50 text-sm font-semibold rounded-lg transition-colors ${config.confirmCls}`}
            >
              {submitting ? 'Processing…' : config.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
