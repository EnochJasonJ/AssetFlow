// src/services/reportService.js
// All API calls for reports & analytics — Devipriya uses this for Screen 9
import { supabase } from '../lib/supabase'

export const reportService = {
  // Asset utilization by status count
  async getAssetStatusSummary() {
    const { data, error } = await supabase
      .from('assets')
      .select('status')
    if (error) return { data: null, error }
    const counts = {}
    ;(data ?? []).forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1 })
    return { data: counts, error: null }
  },

  // Maintenance frequency — count by priority
  async getMaintenanceSummary() {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('priority, status')
    return { data, error }
  },

  // Department allocation summary
  async getDeptAllocationSummary() {
    const { data, error } = await supabase
      .from('allocations')
      .select('department:department_id(name), status')
      .eq('status', 'Active')
    return { data, error }
  },

  // Booking heatmap data — bookings grouped by date
  async getBookingsByDate(startDate, endDate) {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_time, end_time, status, asset:resource_asset_id(name)')
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .neq('status', 'Cancelled')
      .order('start_time')
    return { data, error }
  },

  // Assets due for maintenance/retirement — older than 3 years
  async getAgedAssets() {
    const threshold = new Date()
    threshold.setFullYear(threshold.getFullYear() - 3)
    const { data, error } = await supabase
      .from('assets')
      .select('id, name, asset_tag, acquisition_date, status, category:category_id(name)')
      .lt('acquisition_date', threshold.toISOString())
      .neq('status', 'Retired')
      .neq('status', 'Disposed')
      .order('acquisition_date')
    return { data, error }
  },

  // Activity log feed — for Screen 10
  async getActivityLogs(filters = {}) {
    let query = supabase
      .from('activity_logs')
      .select('*, actor:actor_id(name)')
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 100)

    if (filters.actor_id)    query = query.eq('actor_id', filters.actor_id)
    if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)
    if (filters.from)        query = query.gte('created_at', filters.from)
    if (filters.to)          query = query.lte('created_at', filters.to)
    return query
  },

  // Notifications for current user
  async getNotifications(employeeId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(50)
    return { data, error }
  },

  async markNotificationRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    return { error }
  },

  async markAllNotificationsRead(employeeId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('employee_id', employeeId)
      .is('read_at', null)
    return { error }
  },
}
