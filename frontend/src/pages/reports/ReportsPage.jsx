// src/pages/reports/ReportsPage.jsx
import { useState, useEffect } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import { getReportsData, exportAssetsToCSV } from '../../services/reports'

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const reportData = await getReportsData()
        setData(reportData)
      } catch (err) {
        console.error('Failed to load reports:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleExportCSV = async () => {
    try {
      const csvContent = await exportAssetsToCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `AssetFlow_Asset_Report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to export CSV:', err)
      alert('Failed to export CSV.')
    }
  }

  if (loading || !data) {
    return (
      <AppLayout title="Reports & Analytics">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </AppLayout>
    )
  }

  // Find max maintenance count for bar heights
  const maxMaint = Math.max(...data.maintenanceFreq.map(m => m.count), 1)

  // Map heatmap count to opacity
  const getHeatmapColor = (count) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.02)'
    const opacity = Math.min(0.2 + (count / 18) * 0.8, 1)
    return `rgba(59, 130, 246, ${opacity})`
  }

  return (
    <AppLayout title="Reports & Analytics">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Reports & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            View system utilization, maintenance metrics, and export data.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          📥 Export Assets CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Chart 1: Utilization Trends (SVG Line Chart) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Resource Booking Utilization Trends</h3>
          <div style={{ position: 'relative', height: '220px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <svg viewBox="0 0 500 180" style={{ width: '100%', height: '150px', overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border)" strokeDasharray="3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="var(--border)" strokeDasharray="3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="var(--border)" strokeDasharray="3" />
              <line x1="0" y1="180" x2="500" y2="180" stroke="var(--border)" />

              {/* Data Line Path */}
              <path
                d={`M 20,${180 - (data.utilizationTrends[0].rate * 1.5)} 
                   L 95,${180 - (data.utilizationTrends[1].rate * 1.5)} 
                   L 170,${180 - (data.utilizationTrends[2].rate * 1.5)} 
                   L 245,${180 - (data.utilizationTrends[3].rate * 1.5)} 
                   L 320,${180 - (data.utilizationTrends[4].rate * 1.5)} 
                   L 395,${180 - (data.utilizationTrends[5].rate * 1.5)} 
                   L 470,${180 - (data.utilizationTrends[6].rate * 1.5)}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
              />

              {/* Data Points */}
              {data.utilizationTrends.map((pt, idx) => {
                const x = 20 + idx * 75
                const y = 180 - (pt.rate * 1.5)
                return (
                  <g key={pt.month}>
                    <circle cx={x} cy={y} r="5" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="2" />
                    <text x={x} y={y - 10} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">
                      {pt.rate}%
                    </text>
                  </g>
                )
              })}
            </svg>
            
            {/* X-Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {data.utilizationTrends.map(pt => (
                <span key={pt.month} style={{ width: '40px', textAlign: 'center' }}>{pt.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Maintenance Frequency (Bar Chart) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Maintenance Frequency by Category</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '180px', paddingTop: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            {data.maintenanceFreq.map(m => {
              const heightPct = (m.count / maxMaint) * 100
              return (
                <div key={m.category} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{m.count}</span>
                  <div style={{ height: `${heightPct * 1.2}px`, width: '32px', background: 'var(--info)', borderRadius: '6px 6px 0 0', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', height: '35px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '80px' }} title={m.category}>
                    {m.category}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Chart 3: Department Summary (Horizontal Bars) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Department Allocation Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(data.deptSummary).map(([dept, count]) => {
              const total = Object.values(data.deptSummary).reduce((a, b) => a + b, 0)
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <strong>{dept}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{count} asset{count !== 1 ? 's' : ''} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '99px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: '99px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chart 4: Booking Heatmap (Grid layout) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Weekly Booking Density (Heatmap)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Heatmap header */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <div></div>
              <div>Morning</div>
              <div>Afternoon</div>
              <div>Evening</div>
            </div>

            {/* Heatmap rows */}
            {data.bookingHeatmap.map(row => (
              <div key={row.day} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{row.day}</div>
                
                <div style={{ height: '32px', borderRadius: '4px', background: getHeatmapColor(row.morning), border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: row.morning > 0 ? '#fff' : 'transparent', fontWeight: 'bold' }}>
                  {row.morning}
                </div>
                <div style={{ height: '32px', borderRadius: '4px', background: getHeatmapColor(row.afternoon), border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: row.afternoon > 0 ? '#fff' : 'transparent', fontWeight: 'bold' }}>
                  {row.afternoon}
                </div>
                <div style={{ height: '32px', borderRadius: '4px', background: getHeatmapColor(row.evening), border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: row.evening > 0 ? '#fff' : 'transparent', fontWeight: 'bold' }}>
                  {row.evening}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
