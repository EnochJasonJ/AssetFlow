// src/services/bookingService.js
// All API calls for resource bookings — Devipriya uses this for Screen 6
import { supabase } from '../lib/supabase'

export const bookingService = {
  // Get bookings, optionally filtered by asset or status
  async getAll(filters = {}) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        asset:resource_asset_id(id, name, asset_tag, location),
        booked_by_emp:booked_by(id, name, email),
        department:department_id(name)
      `)
      .order('start_time', { ascending: false })

    if (filters.asset_id) query = query.eq('resource_asset_id', filters.asset_id)
    if (filters.status)   query = query.eq('status', filters.status)
    if (filters.booked_by) query = query.eq('booked_by', filters.booked_by)
    return query
  },

  // Check if a slot overlaps any existing booking for a given asset
  // Rule: new.start < existing.end AND new.end > existing.start  (back-to-back is OK)
  async checkOverlap(assetId, startTime, endTime, excludeBookingId = null) {
    let query = supabase
      .from('bookings')
      .select('id, start_time, end_time, booked_by_emp:booked_by(name)')
      .eq('resource_asset_id', assetId)
      .neq('status', 'Cancelled')
      .lt('start_time', endTime)
      .gt('end_time', startTime)

    if (excludeBookingId) query = query.neq('id', excludeBookingId)
    const { data, error } = await query
    return { overlaps: (data ?? []).length > 0, conflicts: data ?? [], error }
  },

  // Create a new booking (overlap check must also run server-side via Jason's API)
  async create(payload) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({ ...payload, status: 'Upcoming', created_at: new Date().toISOString() })
      .select()
      .single()
    return { data, error }
  },

  // Cancel a booking
  async cancel(id) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled' })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Reschedule — re-runs overlap check before updating
  async reschedule(id, startTime, endTime, assetId) {
    const { overlaps, conflicts } = await bookingService.checkOverlap(assetId, startTime, endTime, id)
    if (overlaps) return { data: null, error: { message: 'Time slot conflicts with existing booking', conflicts } }
    const { data, error } = await supabase
      .from('bookings')
      .update({ start_time: startTime, end_time: endTime, status: 'Upcoming' })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}
