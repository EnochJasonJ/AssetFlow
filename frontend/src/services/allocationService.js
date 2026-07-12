// src/services/allocationService.js
// All API calls for allocations & transfers — Abinivas uses this for Screen 5
import { supabase } from '../lib/supabase'

export const allocationService = {
  // Get all active allocations
  async getAll(filters = {}) {
    let query = supabase
      .from('allocations')
      .select(`
        *,
        asset:asset_id(id, name, asset_tag, status),
        employee:employee_id(id, name, email),
        department:department_id(id, name),
        creator:created_by(name)
      `)
      .order('allocated_at', { ascending: false })

    if (filters.status)      query = query.eq('status', filters.status)
    if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
    return supabase.rpc ? query : query
  },

  // Get overdue allocations (expected_return_date < now AND status = Active)
  async getOverdue() {
    const { data, error } = await supabase
      .from('allocations')
      .select(`*, asset:asset_id(name, asset_tag), employee:employee_id(name, email)`)
      .eq('status', 'Active')
      .lt('expected_return_date', new Date().toISOString())
      .not('expected_return_date', 'is', null)
    return { data, error }
  },

  // Allocate an asset — backend must enforce: no double allocation (row lock + transaction)
  async allocate(payload) {
    // payload: { asset_id, employee_id | department_id, expected_return_date, created_by }
    const { data, error } = await supabase
      .from('allocations')
      .insert({ ...payload, status: 'Active', allocated_at: new Date().toISOString() })
      .select()
      .single()
    return { data, error }
  },

  // Return an asset — marks allocation returned, asset goes Available
  async returnAsset(allocationId, conditionNotes) {
    const { data, error } = await supabase
      .from('allocations')
      .update({
        status: 'Returned',
        actual_return_date: new Date().toISOString(),
        return_condition_notes: conditionNotes,
      })
      .eq('id', allocationId)
      .select()
      .single()
    return { data, error }
  },

  // Transfer requests
  async getTransferRequests(filters = {}) {
    let query = supabase
      .from('transfer_requests')
      .select(`
        *,
        asset:asset_id(name, asset_tag),
        from_emp:from_employee_id(name),
        to_emp:to_employee_id(name),
        requester:requested_by(name),
        approver:approved_by(name)
      `)
      .order('requested_at', { ascending: false })
    if (filters.status) query = query.eq('status', filters.status)
    return query
  },

  async createTransferRequest(payload) {
    const { data, error } = await supabase
      .from('transfer_requests')
      .insert({ ...payload, status: 'Requested', requested_at: new Date().toISOString() })
      .select()
      .single()
    return { data, error }
  },

  async resolveTransfer(id, approved, approvedBy) {
    const { data, error } = await supabase
      .from('transfer_requests')
      .update({ status: approved ? 'Approved' : 'Rejected', approved_by: approvedBy, resolved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}
