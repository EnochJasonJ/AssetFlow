// src/services/bookings.js
import { supabase } from '../lib/supabase'
import { getAssets } from './assets'

const INITIAL_BOOKINGS = [
  {
    id: 'booking-1',
    resource_asset_id: 'asset-1',
    booked_by: 'current-user',
    booked_by_name: 'Bob Smith',
    department_id: 'dept-4',
    start_time: '2026-07-12T09:00:00',
    end_time: '2026-07-12T12:00:00',
    status: 'Completed',
    created_at: '2026-07-11T15:00:00Z'
  },
  {
    id: 'booking-2',
    resource_asset_id: 'asset-3',
    booked_by: 'current-user',
    booked_by_name: 'Alice Johnson',
    department_id: 'dept-1',
    start_time: '2026-07-12T14:00:00',
    end_time: '2026-07-12T16:00:00',
    status: 'Upcoming',
    created_at: '2026-07-12T08:00:00Z'
  },
  {
    id: 'booking-3',
    resource_asset_id: 'asset-4',
    booked_by: 'another-user',
    booked_by_name: 'Charlie Green',
    department_id: 'dept-3',
    start_time: '2026-07-13T10:00:00',
    end_time: '2026-07-13T15:00:00',
    status: 'Upcoming',
    created_at: '2026-07-12T09:00:00Z'
  }
]

function getStorage(key, fallback) {
  const data = localStorage.getItem(key)
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  return JSON.parse(data)
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const isSupabaseValid = () => {
  return supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project.supabase.co')
}

export async function getBookableAssets() {
  const assets = await getAssets()
  return assets.filter(a => a.is_bookable && a.status !== 'Retired' && a.status !== 'Disposed')
}

export async function getBookings() {
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, assets(name, asset_tag)')
        .order('start_time', { ascending: true })
      if (!error && data) {
        return data.map(item => ({
          ...item,
          asset_name: item.assets?.name,
          asset_tag: item.assets?.asset_tag
        }))
      }
    } catch (e) {
      console.warn('Supabase getBookings failed, falling back to mock:', e)
    }
  }

  const bookings = getStorage('af_bookings', INITIAL_BOOKINGS)
  const assets = await getAssets()

  return bookings.map(b => {
    const asset = assets.find(a => a.id === b.resource_asset_id)
    return {
      ...b,
      asset_name: asset ? asset.name : 'Unknown Asset',
      asset_tag: asset ? asset.asset_tag : 'AF-0000'
    }
  })
}

// Check if a new slot overlaps with existing non-cancelled bookings for the same asset
export function checkOverlap(newStart, newEnd, assetId, bookings, excludeBookingId = null) {
  const start = new Date(newStart)
  const end = new Date(newEnd)

  for (const b of bookings) {
    if (b.resource_asset_id !== assetId || b.status === 'Cancelled' || b.id === excludeBookingId) {
      continue
    }

    const bStart = new Date(b.start_time)
    const bEnd = new Date(b.end_time)

    // Overlap condition: start < bEnd AND end > bStart
    if (start < bEnd && end > bStart) {
      return b
    }
  }
  return null
}

export async function createBooking(bookingData, userName) {
  const allBookings = await getBookings()

  // Overlap check
  const conflict = checkOverlap(
    bookingData.start_time,
    bookingData.end_time,
    bookingData.resource_asset_id,
    allBookings
  )

  if (conflict) {
    throw new Error(`This slot conflicts with a booking by ${conflict.booked_by_name || 'another employee'} from ${new Date(conflict.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(conflict.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${new Date(conflict.start_time).toLocaleDateString()}`)
  }

  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          resource_asset_id: bookingData.resource_asset_id,
          booked_by: bookingData.booked_by || 'current-user',
          department_id: bookingData.department_id || null,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          status: 'Upcoming'
        }])
        .select()
      if (!error && data) return data[0]
    } catch (e) {
      console.warn('Supabase createBooking failed, falling back to mock:', e)
    }
  }

  const newBooking = {
    id: `booking-${Date.now()}`,
    resource_asset_id: bookingData.resource_asset_id,
    booked_by: bookingData.booked_by || 'current-user',
    booked_by_name: userName || 'Devipriya',
    department_id: bookingData.department_id || null,
    start_time: bookingData.start_time,
    end_time: bookingData.end_time,
    status: 'Upcoming',
    created_at: new Date().toISOString()
  }

  const bookings = getStorage('af_bookings', INITIAL_BOOKINGS)
  bookings.push(newBooking)
  setStorage('af_bookings', bookings)

  // Log activity
  const logs = getStorage('af_logs', [])
  logs.unshift({
    id: `log-${Date.now()}`,
    actor_id: 'current-user',
    action: 'Booking Created',
    entity_type: 'booking',
    entity_id: newBooking.id,
    metadata: { start_time: newBooking.start_time, end_time: newBooking.end_time },
    created_at: new Date().toISOString()
  })
  setStorage('af_logs', logs)

  // Trigger notification
  const notifications = getStorage('af_notifications', [])
  notifications.unshift({
    id: `notif-${Date.now()}`,
    employee_id: 'current-user',
    type: 'BookingConfirmed',
    message: `Booking for resource confirmed: ${new Date(newBooking.start_time).toLocaleString()}`,
    related_entity_type: 'booking',
    related_entity_id: newBooking.id,
    read_at: null,
    created_at: new Date().toISOString()
  })
  setStorage('af_notifications', notifications)

  return newBooking
}

export async function cancelBooking(bookingId) {
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId)
        .select()
      if (!error && data) return data[0]
    } catch (e) {
      console.warn('Supabase cancelBooking failed, falling back to mock:', e)
    }
  }

  const bookings = getStorage('af_bookings', INITIAL_BOOKINGS)
  const bookingIndex = bookings.findIndex(b => b.id === bookingId)
  if (bookingIndex !== -1) {
    if (bookings[bookingIndex].status !== 'Upcoming') {
      throw new Error('Only upcoming bookings can be cancelled.')
    }
    bookings[bookingIndex].status = 'Cancelled'
    setStorage('af_bookings', bookings)

    // Log activity & Notify
    const logs = getStorage('af_logs', [])
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: 'current-user',
      action: 'Booking Cancelled',
      entity_type: 'booking',
      entity_id: bookingId,
      metadata: {},
      created_at: new Date().toISOString()
    })
    setStorage('af_logs', logs)

    const notifications = getStorage('af_notifications', [])
    notifications.unshift({
      id: `notif-${Date.now()}`,
      employee_id: 'current-user',
      type: 'BookingCancelled',
      message: `Booking has been cancelled.`,
      related_entity_type: 'booking',
      related_entity_id: bookingId,
      read_at: null,
      created_at: new Date().toISOString()
    })
    setStorage('af_notifications', notifications)
  }
}

export async function rescheduleBooking(bookingId, startTime, endTime) {
  const allBookings = await getBookings()
  const booking = allBookings.find(b => b.id === bookingId)
  if (!booking) {
    throw new Error('Booking not found.')
  }
  if (booking.status !== 'Upcoming') {
    throw new Error('Only upcoming bookings can be rescheduled.')
  }

  // Overlap check excluding current booking
  const conflict = checkOverlap(startTime, endTime, booking.resource_asset_id, allBookings, bookingId)
  if (conflict) {
    throw new Error(`This slot conflicts with a booking by ${conflict.booked_by_name || 'another employee'} from ${new Date(conflict.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(conflict.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${new Date(conflict.start_time).toLocaleDateString()}`)
  }

  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ start_time: startTime, end_time: endTime })
        .eq('id', bookingId)
        .select()
      if (!error && data) return data[0]
    } catch (e) {
      console.warn('Supabase rescheduleBooking failed, falling back to mock:', e)
    }
  }

  const bookings = getStorage('af_bookings', INITIAL_BOOKINGS)
  const bookingIndex = bookings.findIndex(b => b.id === bookingId)
  if (bookingIndex !== -1) {
    bookings[bookingIndex].start_time = startTime
    bookings[bookingIndex].end_time = endTime
    setStorage('af_bookings', bookings)

    // Log activity
    const logs = getStorage('af_logs', [])
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: 'current-user',
      action: 'Booking Rescheduled',
      entity_type: 'booking',
      entity_id: bookingId,
      metadata: { start_time: startTime, end_time: endTime },
      created_at: new Date().toISOString()
    })
    setStorage('af_logs', logs)
  }
}
