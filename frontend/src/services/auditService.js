// src/services/auditService.js
// All API calls for audit cycles — Abinivas uses this for Screen 8
import { supabase } from '../lib/supabase'

export const auditService = {
  async getCycles() {
    const { data, error } = await supabase
      .from('audit_cycles')
      .select(`*, dept:scope_department_id(name), creator:created_by(name), audit_cycle_auditors(employee:employee_id(name))`)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createCycle(payload) {
    // payload: { scope_department_id?, scope_location?, start_date, end_date, created_by }
    const { data, error } = await supabase
      .from('audit_cycles')
      .insert({ ...payload, status: 'Open' })
      .select()
      .single()
    return { data, error }
  },

  async assignAuditors(cycleId, employeeIds) {
    const rows = employeeIds.map(id => ({ audit_cycle_id: cycleId, employee_id: id }))
    const { error } = await supabase.from('audit_cycle_auditors').insert(rows)
    return { error }
  },

  async getItems(cycleId) {
    const { data, error } = await supabase
      .from('audit_items')
      .select(`*, asset:asset_id(id, name, asset_tag, status, location), auditor:auditor_id(name)`)
      .eq('audit_cycle_id', cycleId)
      .order('asset_id')
    return { data, error }
  },

  async updateItem(itemId, result, notes) {
    const { data, error } = await supabase
      .from('audit_items')
      .update({ result, notes, checked_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single()
    return { data, error }
  },

  // Get discrepancy report — Missing or Damaged items (derived, not a separate table)
  async getDiscrepancies(cycleId) {
    const { data, error } = await supabase
      .from('audit_items')
      .select(`*, asset:asset_id(name, asset_tag, location)`)
      .eq('audit_cycle_id', cycleId)
      .in('result', ['Missing', 'Damaged'])
    return { data, error }
  },

  // Close audit cycle — MUST be done via Jason's API endpoint (atomic transaction server-side)
  // This locks the cycle AND updates Missing assets to Lost in one DB transaction
  async closeCycle(cycleId) {
    // Call the backend API route — NOT direct Supabase call
    // Jason's endpoint: POST /api/v1/audit/:id/close
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    const res = await fetch(`/api/v1/audit/${cycleId}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    const body = await res.json()
    if (!res.ok) return { error: body }
    return { data: body }
  },
}
