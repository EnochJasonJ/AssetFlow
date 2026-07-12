/**
 * RaiseRequestModal — Part of Screen 7
 *
 * Any user (Employee / Asset Manager / etc.) can raise a maintenance request.
 * Asset stays at current status until an Asset Manager APPROVES the request.
 */

import { useState, useEffect } from 'react'
import { raiseRequest } from '../../services/maintenance'

const inputCls =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 ' +
  'placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const PRIORITY_COLORS = {
  Low:      'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  Medium:   'border-yellow-500  bg-yellow-500/10  text-yellow-400',
  High:     'border-orange-500  bg-orange-500/10  text-orange-400',
  Critical: 'border-red-500     bg-red-500/10     text-red-400',
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
    fetch('/api/v1/assets')
      .then(r => r.ok ? r.json() : [])
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Raise Maintenance Request</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Asset picker */}
          <div className="space-y-1.5">
            <label htmlFor="raise-asset-id" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Asset <span className="text-red-400">*</span>
            </label>
            {loadingAssets ? (
              <div className={`${inputCls} text-gray-500`}>Loading assets…</div>
            ) : assets.length > 0 ? (
              <select
                id="raise-asset-id"
                value={form.assetId}
                onChange={e => set('assetId', e.target.value)}
                className={inputCls}
              >
                <option value="">Select asset…</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.asset_tag} — {a.name} ({a.status})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="raise-asset-id"
                type="text"
                value={form.assetId}
                onChange={e => set('assetId', e.target.value)}
                placeholder="Paste asset ID"
                className={inputCls}
              />
            )}
            {errors.assetId && <p className="text-xs text-red-400">{errors.assetId}</p>}
          </div>

          {/* Issue description */}
          <div className="space-y-1.5">
            <label htmlFor="raise-issue" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Issue Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="raise-issue"
              rows={3}
              value={form.issueDescription}
              onChange={e => set('issueDescription', e.target.value)}
              placeholder="Describe the issue in detail — what is wrong, when did it start, what impact does it have…"
              className={`${inputCls} resize-none`}
            />
            {errors.issueDescription && <p className="text-xs text-red-400">{errors.issueDescription}</p>}
          </div>

          {/* Priority selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    form.priority === p
                      ? PRIORITY_COLORS[p]
                      : 'border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Photo URL (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="raise-photo-url" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Photo URL <span className="text-gray-600 font-normal normal-case">(optional)</span>
            </label>
            <input
              id="raise-photo-url"
              type="url"
              value={form.photoUrl}
              onChange={e => set('photoUrl', e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
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
              id="btn-submit-raise-request"
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Submitting…' : 'Raise Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
