/**
 * AuditChecklist — Part of Screen 8
 *
 * Renders inside the CycleDetail panel when an Open cycle is selected.
 * Shows all audit items (one per in-scope asset) as a checklist.
 * Each row: Asset Tag, Name, Location, result selector, notes input.
 *
 * Auto-generated discrepancy report section below:
 *   Derived from items where result is Missing or Damaged.
 *   Never hard-coded — always computed from current items.
 *
 * Closed cycles: all inputs disabled, shows final state.
 */

import { useState, useEffect, useCallback } from 'react'
import { getAuditItems, logAuditItem } from '../../services/audit'

const RESULTS = ['Pending', 'Verified', 'Missing', 'Damaged']

const RESULT_STYLES = {
  Pending:  { cls: 'bg-gray-700  text-gray-400',   dot: 'bg-gray-500' },
  Verified: { cls: 'bg-emerald-600/30 text-emerald-300', dot: 'bg-emerald-400' },
  Missing:  { cls: 'bg-red-600/30     text-red-300',     dot: 'bg-red-400' },
  Damaged:  { cls: 'bg-amber-600/30   text-amber-300',   dot: 'bg-amber-400' },
}

function ResultBadge({ result }) {
  const s = RESULT_STYLES[result] ?? RESULT_STYLES.Pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {result}
    </span>
  )
}

export default function AuditChecklist({ cycleId, isOpen }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Track per-row saving state
  const [saving, setSaving] = useState({}) // { [itemId]: true | 'error' | undefined }

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAuditItems(cycleId)
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [cycleId])

  useEffect(() => { loadItems() }, [loadItems])

  async function handleResultChange(item, newResult) {
    if (!isOpen) return // Closed cycles: read-only

    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, result: newResult } : i))
    setSaving(prev => ({ ...prev, [item.id]: true }))

    try {
      await logAuditItem(cycleId, {
        assetId: item.asset.id,
        result: newResult,
        notes: item.notes,
      })
    } catch {
      // Revert optimistic update on error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, result: item.result } : i))
      setSaving(prev => ({ ...prev, [item.id]: 'error' }))
    } finally {
      setSaving(prev => ({ ...prev, [item.id]: undefined }))
    }
  }

  async function handleNotesChange(item, newNotes) {
    if (!isOpen) return
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, notes: newNotes } : i))
  }

  async function handleNotesSave(item) {
    if (!isOpen) return
    setSaving(prev => ({ ...prev, [`notes-${item.id}`]: true }))
    try {
      await logAuditItem(cycleId, {
        assetId: item.asset.id,
        result: item.result,
        notes: item.notes ?? '',
      })
    } catch {
      setSaving(prev => ({ ...prev, [`notes-${item.id}`]: 'error' }))
    } finally {
      setSaving(prev => ({ ...prev, [`notes-${item.id}`]: undefined }))
    }
  }

  // Auto-generated discrepancy report
  const discrepancies = items.filter(i => i.result === 'Missing' || i.result === 'Damaged')

  // Progress stats
  const verified = items.filter(i => i.result === 'Verified').length
  const total = items.length
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-600 text-sm">
        <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading assets…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
        {error}
        <button onClick={loadItems} className="ml-auto underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{verified} of {total} assets verified</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap">
        {RESULTS.map(r => {
          const count = items.filter(i => i.result === r).length
          return (
            <div key={r} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${RESULT_STYLES[r]?.cls ?? ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${RESULT_STYLES[r]?.dot ?? ''}`} />
              {r}: {count}
            </div>
          )
        })}
      </div>

      {/* ── Asset checklist table ── */}
      <div className="border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-600 text-sm">
                  No assets in scope for this cycle
                </td>
              </tr>
            )}
            {items.map(item => {
              const isSaving = saving[item.id] === true
              const isError  = saving[item.id] === 'error'
              return (
                <tr key={item.id} className={`transition-colors ${
                  item.result === 'Missing' ? 'bg-red-950/20' :
                  item.result === 'Damaged' ? 'bg-amber-950/20' :
                  'hover:bg-gray-800/30'
                }`}>
                  {/* Asset */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-violet-400">{item.asset?.asset_tag}</p>
                    <p className="text-sm font-medium text-gray-200">{item.asset?.name}</p>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {item.asset?.location ?? '—'}
                  </td>

                  {/* Result dropdown */}
                  <td className="px-4 py-3">
                    {isOpen ? (
                      <div className="flex items-center gap-2">
                        <select
                          id={`audit-result-${item.id}`}
                          value={item.result ?? 'Pending'}
                          onChange={e => handleResultChange(item, e.target.value)}
                          disabled={isSaving}
                          className={`px-2 py-1 text-xs font-semibold rounded-lg border bg-gray-800 transition-colors focus:outline-none focus:border-violet-500 ${
                            item.result === 'Verified' ? 'border-emerald-500/50 text-emerald-300' :
                            item.result === 'Missing'  ? 'border-red-500/50     text-red-300' :
                            item.result === 'Damaged'  ? 'border-amber-500/50   text-amber-300' :
                            'border-gray-700 text-gray-400'
                          }`}
                        >
                          {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {isSaving && (
                          <svg className="w-3 h-3 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        {isError && <span className="text-xs text-red-400">Save failed</span>}
                      </div>
                    ) : (
                      <ResultBadge result={item.result ?? 'Pending'} />
                    )}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3">
                    {isOpen ? (
                      <input
                        id={`audit-notes-${item.id}`}
                        type="text"
                        value={item.notes ?? ''}
                        onChange={e => handleNotesChange(item, e.target.value)}
                        onBlur={() => handleNotesSave(item)}
                        placeholder="Add notes…"
                        className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">{item.notes ?? '—'}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Discrepancy Report (auto-derived) ── */}
      <div className="border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Discrepancy Report</h3>
          <span className="text-xs text-gray-600">
            {discrepancies.length === 0 ? 'No discrepancies' : `${discrepancies.length} item${discrepancies.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {discrepancies.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-600 text-sm flex flex-col items-center gap-2">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No missing or damaged assets
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {discrepancies.map(item => (
              <div key={item.id} className={`flex items-start gap-4 px-4 py-3 ${
                item.result === 'Missing' ? 'bg-red-950/15' : 'bg-amber-950/15'
              }`}>
                <ResultBadge result={item.result} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-violet-400">{item.asset?.asset_tag}</span>
                    <span className="text-sm font-medium text-gray-200">{item.asset?.name}</span>
                  </div>
                  {item.asset?.location && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.asset.location}</p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">"{item.notes}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
