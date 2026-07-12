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

// Dot colours for summary chips (inline, not Tailwind)
const RESULT_DOT = {
  Pending:  '#9ca3af',
  Verified: '#059669',
  Missing:  '#dc2626',
  Damaged:  '#d97706',
}

const RESULT_CHIP_STYLE = {
  Pending:  { background: 'rgba(156,163,175,0.15)', color: '#9ca3af' },
  Verified: { background: 'rgba(5,150,105,0.15)',   color: '#059669' },
  Missing:  { background: 'rgba(220,38,38,0.15)',   color: '#dc2626' },
  Damaged:  { background: 'rgba(217,119,6,0.15)',   color: '#d97706' },
}

// Maps result value → global badge class name
function resultBadgeClass(result) {
  switch (result) {
    case 'Verified': return 'badge badge-approved'
    case 'Missing':  return 'badge badge-lost'
    case 'Damaged':  return 'badge badge-maintenance'
    case 'Pending':
    default:         return 'badge badge-pending'
  }
}

function ResultBadge({ result }) {
  return (
    <span className={resultBadgeClass(result ?? 'Pending')}>
      {result ?? 'Pending'}
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        gap: '8px',
      }}>
        <span className="spinner" style={{ width: '16px', height: '16px' }} />
        Loading assets…
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>{error}</span>
        <button
          onClick={loadItems}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '0.875rem',
            padding: 0,
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          <span>{verified} of {total} assets verified</span>
          <span>{pct}%</span>
        </div>
        <div style={{
          height: '6px',
          background: 'var(--border)',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--success)',
              borderRadius: '9999px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {RESULTS.map(r => {
          const count = items.filter(i => i.result === r).length
          const chipStyle = RESULT_CHIP_STYLE[r] ?? RESULT_CHIP_STYLE.Pending
          return (
            <div
              key={r}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: chipStyle.background,
                color: chipStyle.color,
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: RESULT_DOT[r] ?? '#9ca3af',
                flexShrink: 0,
              }} />
              {r}: {count}
            </div>
          )
        })}
      </div>

      {/* ── Asset checklist table ── */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-hover)',
            }}>
              {['Asset', 'Location', 'Result', 'Notes'].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                  }}
                >
                  No assets in scope for this cycle
                </td>
              </tr>
            )}
            {items.map(item => {
              const isSaving = saving[item.id] === true
              const isError  = saving[item.id] === 'error'

              const rowBg =
                item.result === 'Missing' ? 'rgba(220,38,38,0.05)' :
                item.result === 'Damaged' ? 'rgba(217,119,6,0.05)' :
                'transparent'

              return (
                <tr
                  key={item.id}
                  style={{
                    borderTop: '1px solid var(--border-light)',
                    background: rowBg,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!item.result || item.result === 'Verified' || item.result === 'Pending') {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = rowBg
                  }}
                >
                  {/* Asset */}
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'var(--accent)',
                      margin: 0,
                    }}>
                      {item.asset?.asset_tag}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      margin: '2px 0 0',
                    }}>
                      {item.asset?.name}
                    </p>
                  </td>

                  {/* Location */}
                  <td style={{
                    padding: '12px 16px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}>
                    {item.asset?.location ?? '—'}
                  </td>

                  {/* Result dropdown */}
                  <td style={{ padding: '12px 16px' }}>
                    {isOpen ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          id={`audit-result-${item.id}`}
                          value={item.result ?? 'Pending'}
                          onChange={e => handleResultChange(item, e.target.value)}
                          disabled={isSaving}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius)',
                            border: `1px solid ${
                              item.result === 'Verified' ? 'rgba(5,150,105,0.5)' :
                              item.result === 'Missing'  ? 'rgba(220,38,38,0.5)' :
                              item.result === 'Damaged'  ? 'rgba(217,119,6,0.5)' :
                              'var(--border)'
                            }`,
                            background: 'var(--bg-surface)',
                            color:
                              item.result === 'Verified' ? 'var(--success)' :
                              item.result === 'Missing'  ? 'var(--danger)' :
                              item.result === 'Damaged'  ? 'var(--warning)' :
                              'var(--text-secondary)',
                            outline: 'none',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {isSaving && (
                          <span className="spinner" style={{ width: '12px', height: '12px' }} />
                        )}
                        {isError && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                            Save failed
                          </span>
                        )}
                      </div>
                    ) : (
                      <ResultBadge result={item.result ?? 'Pending'} />
                    )}
                  </td>

                  {/* Notes */}
                  <td style={{ padding: '12px 16px' }}>
                    {isOpen ? (
                      <input
                        id={`audit-notes-${item.id}`}
                        type="text"
                        value={item.notes ?? ''}
                        onChange={e => handleNotesChange(item, e.target.value)}
                        onBlur={() => handleNotesSave(item)}
                        placeholder="Add notes…"
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'border-color 0.15s',
                          boxSizing: 'border-box',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                        onBlurCapture={e => { e.target.style.borderColor = 'var(--border)' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.notes ?? '—'}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Discrepancy Report (auto-derived) ── */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-hover)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            Discrepancy Report
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {discrepancies.length === 0
              ? 'No discrepancies'
              : `${discrepancies.length} item${discrepancies.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {discrepancies.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg
              style={{ width: '24px', height: '24px', color: 'var(--border-light)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No missing or damaged assets
          </div>
        ) : (
          <div>
            {discrepancies.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-light)',
                  background: item.result === 'Missing'
                    ? 'rgba(220,38,38,0.04)'
                    : 'rgba(217,119,6,0.04)',
                }}
              >
                <ResultBadge result={item.result} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'var(--accent)',
                    }}>
                      {item.asset?.asset_tag}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}>
                      {item.asset?.name}
                    </span>
                  </div>
                  {item.asset?.location && (
                    <p style={{
                      margin: '2px 0 0',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}>
                      {item.asset.location}
                    </p>
                  )}
                  {item.notes && (
                    <p style={{
                      margin: '4px 0 0',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                    }}>
                      "{item.notes}"
                    </p>
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
