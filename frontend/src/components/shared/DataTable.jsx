// DataTable — reusable sortable table
// columns: [{ key, label, render?: (row) => node }]
// data: array of objects
import { useState } from 'react'

export default function DataTable({ columns, data = [], emptyMessage = 'No records found.', loading = false }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const toggle = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? ''
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    : data

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  )

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} onClick={() => !col.noSort && toggle(col.key)}
                style={{ cursor: col.noSort ? 'default' : 'pointer', userSelect: 'none' }}>
                {col.label}
                {sortKey === col.key && <span style={{ marginLeft: 4, opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0
            ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>{emptyMessage}</td></tr>
            : sorted.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(col => (
                    <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                  ))}
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  )
}
