// src/services/maintenanceService.js
// All API calls for maintenance requests — Abinivas uses this for Screen 7
import { supabase } from '../lib/supabase'

export const maintenanceService = {
  async getAll(filters = {}) {
    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        asset:asset_id(id, name, asset_tag, status),
        raised_by_emp:raised_by(id, name),
        approved_by_emp:approved_by(name)
      `)
      .order('raised_at', { ascending: false })

    if (filters.status)   query = query.eq('status', filters.status)
    if (filters.asset_id) query = query.eq('asset_id', filters.asset_id)
    if (filters.priority) query = query.eq('priority', filters.priority)
    return query
  },

  // Raise a new maintenance request — asset stays current status (NOT Under Maintenance yet)
  async raise(payload) {
    // payload: { asset_id, raised_by, issue_description, priority, photo_url? }
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({ ...payload, status: 'Pending', raised_at: new Date().toISOString() })
      .select()
      .single()
    return { data, error }
  },

  // Approve — Asset Manager only. This flips asset status to UnderMaintenance
  async approve(id, approvedBy) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status: 'Approved', approved_by: approvedBy })
      .eq('id', id)
      .select()
      .single()
    // Asset status update (UnderMaintenance) must happen server-side via Jason's API
    return { data, error }
  },

  // Reject — does NOT change asset status
  async reject(id, approvedBy) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status: 'Rejected', approved_by: approvedBy })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Assign technician
  async assignTechnician(id, technicianName) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status: 'TechnicianAssigned', technician_name: technicianName })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Mark In Progress
  async startWork(id) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status: 'InProgress' })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Resolve — flips asset back to Available (or Allocated if still held)
  async resolve(id) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status: 'Resolved', resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    // Asset status revert must happen server-side
    return { data, error }
  },
}
