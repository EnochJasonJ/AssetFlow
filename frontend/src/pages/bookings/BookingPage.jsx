// src/pages/bookings/BookingPage.jsx
import { useState, useEffect } from 'react'
import AppLayout from '../../components/shared/AppLayout'
import Modal from '../../components/shared/Modal'
import StatusBadge from '../../components/shared/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { getBookableAssets, getBookings, createBooking, cancelBooking, rescheduleBooking } from '../../services/bookings'
import { getDepartments } from '../../services/assets'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 to 21:00

export default function BookingPage() {
  const { profile } = useAuth()
  
  const [resources, setResources] = useState([])
  const [bookings, setBookings] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  // Selected resource and date for the calendar view
  const [selectedResource, setSelectedResource] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Modals
  const [bookOpen, setBookOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [activeBooking, setActiveBooking] = useState(null)

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    resource_asset_id: '',
    department_id: '',
    start_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_date: new Date().toISOString().split('T')[0],
    end_time: '11:00'
  })

  // Reschedule Form State
  const [rescheduleForm, setRescheduleForm] = useState({
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: ''
  })

  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Auto-select first resource when resources load
  useEffect(() => {
    if (resources.length > 0 && !selectedResource) {
      setSelectedResource(resources[0].id)
    }
  }, [resources, selectedResource])

  async function loadData() {
    setLoading(true)
    try {
      const [resData, bookingsData, deptsData] = await Promise.all([
        getBookableAssets(),
        getBookings(),
        getDepartments()
      ])
      setResources(resData)
      setBookings(bookingsData)
      setDepartments(deptsData)
    } catch (err) {
      console.error('Failed to load bookings data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBookSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setActionLoading(true)

    const startISO = new Date(`${bookingForm.start_date}T${bookingForm.start_time}:00`).toISOString()
    const endISO = new Date(`${bookingForm.end_date}T${bookingForm.end_time}:00`).toISOString()

    if (new Date(startISO) >= new Date(endISO)) {
      setFormError('End time must be after start time.')
      setActionLoading(false)
      return
    }

    try {
      await createBooking({
        resource_asset_id: bookingForm.resource_asset_id || selectedResource,
        department_id: bookingForm.department_id || null,
        start_time: startISO,
        end_time: endISO,
        booked_by: profile?.id || 'current-user'
      }, profile?.name)

      setFormSuccess('Booking confirmed successfully!')
      setBookOpen(false)
      // Refresh list
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelClick = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    try {
      await cancelBooking(bookingId)
      await loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRescheduleClick = (booking) => {
    setActiveBooking(booking)
    const startDate = booking.start_time.split('T')[0]
    const startTime = booking.start_time.split('T')[1].substring(0, 5)
    const endDate = booking.end_time.split('T')[0]
    const endTime = booking.end_time.split('T')[1].substring(0, 5)

    setRescheduleForm({
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime
    })
    setFormError('')
    setRescheduleOpen(true)
  }

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setActionLoading(true)

    const startISO = new Date(`${rescheduleForm.start_date}T${rescheduleForm.start_time}:00`).toISOString()
    const endISO = new Date(`${rescheduleForm.end_date}T${rescheduleForm.end_time}:00`).toISOString()

    if (new Date(startISO) >= new Date(endISO)) {
      setFormError('End time must be after start time.')
      setActionLoading(false)
      return
    }

    try {
      await rescheduleBooking(activeBooking.id, startISO, endISO)
      setRescheduleOpen(false)
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Get active/non-cancelled bookings for the selected resource on the selected date
  const resourceBookings = bookings.filter(b => {
    if (b.resource_asset_id !== selectedResource) return false
    if (b.status === 'Cancelled' || b.status === 'CANCELLED') return false

    const utcDateStr = b.start_time ? b.start_time.split('T')[0] : ''
    const localDateStr = b.start_time ? new Date(b.start_time).toLocaleDateString('en-CA') : ''
    return utcDateStr === selectedDate || localDateStr === selectedDate
  })

  // Get all bookings overlapping a specific hour (e.g. 10:00)
  const getBookingsForHour = (hour) => {
    return resourceBookings.filter(b => {
      const bStart = new Date(b.start_time).getHours()
      const bEnd = new Date(b.end_time).getHours()
      const bEndMin = new Date(b.end_time).getMinutes()
      const endHour = (bEnd > bStart && bEndMin === 0) ? bEnd : bEnd + 1
      return hour >= bStart && hour < endHour
    })
  }

  const statusColors = {
    Upcoming: 'var(--accent)',
    Ongoing: 'var(--success)',
    Completed: 'var(--text-muted)',
    Cancelled: 'var(--danger)'
  }

  return (
    <AppLayout title="Resource Booking">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Resource Booking</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Book shared resources and manage reservations without schedule overlaps.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormError('')
          setFormSuccess('')
          setBookingForm({
            ...bookingForm,
            resource_asset_id: selectedResource
          })
          setBookOpen(true)
        }}>
          📅 Book a Slot
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Filter / Resource Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Select Resource</h3>
            <div className="form-group">
              <label>Resource / Asset</label>
              <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.asset_tag})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Legend</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: statusColors.Upcoming }} />
                <span>Upcoming Slot</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: statusColors.Ongoing }} />
                <span>Ongoing Slot</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: statusColors.Completed }} />
                <span>Completed Slot</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: statusColors.Cancelled }} />
                <span>Cancelled / Free Slot</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Hour Scheduler */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Schedule: {resources.find(r => r.id === selectedResource)?.name || 'Resource'}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(selectedDate).toDateString()}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {HOURS.map(hour => {
                const hourBookings = getBookingsForHour(hour)
                const isOccupied = hourBookings.length > 0
                const displayHour = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`

                return (
                  <div key={hour} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '80px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, paddingTop: '0.4rem' }}>
                      {displayHour}
                    </div>
                    <div style={{ flex: 1, minHeight: '40px', borderRadius: '6px', background: isOccupied ? 'transparent' : 'rgba(255, 255, 255, 0.02)', border: isOccupied ? 'none' : '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: isOccupied ? 0 : '0 0.75rem', justifyContent: 'center' }}>
                      {isOccupied ? (
                        hourBookings.map(booking => (
                          <div key={booking.id} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.08)', border: `1px solid ${statusColors[booking.status] || 'var(--accent)'}`, borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                            <div>
                              <strong>{booking.booked_by_name}</strong>
                              <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                ({new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <StatusBadge status={booking.status} />
                              {booking.status === 'Upcoming' && (
                                <>
                                  <button className="btn btn-secondary btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleRescheduleClick(booking)}>Reschedule</button>
                                  <button className="btn btn-danger btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleCancelClick(booking.id)}>Cancel</button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Slot Available</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Book Slot Modal */}
      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Book Resource Slot" width="550px">
        <form onSubmit={handleBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {formError && (
            <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label>Resource</label>
            <select
              value={bookingForm.resource_asset_id || selectedResource}
              onChange={(e) => setBookingForm({ ...bookingForm, resource_asset_id: e.target.value })}
            >
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.asset_tag})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                required
                value={bookingForm.start_date}
                onChange={(e) => setBookingForm({ ...bookingForm, start_date: e.target.value, end_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                required
                value={bookingForm.start_time}
                onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                required
                value={bookingForm.end_date}
                onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                required
                value={bookingForm.end_time}
                onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Book on behalf of Department (Optional)</label>
            <select
              value={bookingForm.department_id}
              onChange={(e) => setBookingForm({ ...bookingForm, department_id: e.target.value })}
            >
              <option value="">No Department (Personal Booking)</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setBookOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} title="Reschedule Booking" width="550px">
        <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {formError && (
            <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>New Start Date</label>
              <input
                type="date"
                required
                value={rescheduleForm.start_date}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, start_date: e.target.value, end_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>New Start Time</label>
              <input
                type="time"
                required
                value={rescheduleForm.start_time}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, start_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>New End Date</label>
              <input
                type="date"
                required
                value={rescheduleForm.end_date}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, end_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>New End Time</label>
              <input
                type="time"
                required
                value={rescheduleForm.end_time}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, end_time: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setRescheduleOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Updating...' : 'Reschedule Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
