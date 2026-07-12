// src/pages/logs/ActivityLogsPage.jsx
import { useState, useEffect } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import DataTable from '../../components/shared/DataTable'
import { getNotifications, markNotificationRead, markAllNotificationsRead, getActivityLogs } from '../../services/logs'

export default function ActivityLogsPage() {
  const [notifications, setNotifications] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters for Activity Logs
  const [actorFilter, setActorFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [notifsData, logsData] = await Promise.all([
        getNotifications(),
        getActivityLogs()
      ])
      setNotifications(notifsData)
      setLogs(logsData)
    } catch (err) {
      console.error('Failed to load logs/notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id)
      await loadData()
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      await loadData()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const unreadNotifs = notifications.filter(n => !n.read_at)
  const readNotifs = notifications.filter(n => n.read_at)

  // Filter logs logic
  const filteredLogs = logs.filter(log => {
    const matchesActor = !actorFilter || log.actor_name?.toLowerCase().includes(actorFilter.toLowerCase())
    const matchesEntity = !entityFilter || log.entity_type === entityFilter
    
    let matchesDate = true
    if (startDate) {
      matchesDate = matchesDate && new Date(log.created_at) >= new Date(`${startDate}T00:00:00`)
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(log.created_at) <= new Date(`${endDate}T23:59:59`)
    }

    return matchesActor && matchesEntity && matchesDate
  })

  const logColumns = [
    { key: 'actor_name', label: 'Actor' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.action}</span>
    },
    {
      key: 'entity_type',
      label: 'Entity Type',
      render: (row) => (
        <span className="badge badge-secondary" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
          {row.entity_type}
        </span>
      )
    },
    {
      key: 'metadata',
      label: 'Metadata',
      noSort: true,
      render: (row) => (
        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
          {row.metadata ? JSON.stringify(row.metadata) : 'N/A'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (row) => new Date(row.created_at).toLocaleString()
    }
  ]

  return (
    <AppLayout title="Activity Logs & Notifications">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Activity Logs & Notifications</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Monitor system actions and view audit logs and incoming alerts.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Notification Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Notifications ({unreadNotifs.length} Unread)
              </h3>
              {unreadNotifs.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent)', padding: 0 }}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                {/* Unread Section */}
                {unreadNotifs.map(notif => (
                  <div key={notif.id} className="card" style={{ padding: '0.75rem', background: 'var(--accent-glow)', border: '1px solid var(--accent)', fontSize: '0.82rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', paddingRight: '1.2rem' }}>
                      <span className="badge badge-accent" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 'bold' }}>
                        {notif.type?.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <button
                        style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', position: 'absolute', top: '0.75rem', right: '0.75rem' }}
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    </div>
                    <p style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>{notif.message}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}

                {/* Read Section */}
                {readNotifs.map(notif => (
                  <div key={notif.id} className="card" style={{ padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '0.82rem', opacity: 0.65 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span className="badge badge-secondary" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                        {notif.type?.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{notif.message}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity Logs Audit Trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Filters Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Filter Logs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Actor</label>
                <input
                  type="text"
                  placeholder="Filter by employee name..."
                  value={actorFilter}
                  onChange={(e) => setActorFilter(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Entity Type</label>
                <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
                  <option value="">All Entities</option>
                  <option value="asset">Asset</option>
                  <option value="booking">Booking</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="database">Database</option>
                  <option value="ui">UI Setup</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="card" style={{ padding: 0 }}>
            <DataTable
              columns={logColumns}
              data={filteredLogs}
              loading={loading}
              emptyMessage="No activity logs found for this filter."
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
