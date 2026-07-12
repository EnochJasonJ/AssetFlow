// src/services/assetService.js
// All API calls for assets — import this in any component that needs asset data
import { supabase } from '../lib/supabase'

export const assetService = {
  // Get all assets with category info
  async getAll(filters = {}) {
    let query = supabase
      .from('assets')
      .select('*, category:category_id(id, name), allocations(id, status, employee:employee_id(name), department:department_id(name))')
      .order('created_at', { ascending: false })

    if (filters.status)      query = query.eq('status', filters.status)
    if (filters.category_id) query = query.eq('category_id', filters.category_id)
    if (filters.location)    query = query.ilike('location', `%${filters.location}%`)
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`
      )
    }
    const { data, error } = await query
    return { data, error }
  },

  // Get a single asset with full history
  async getById(id) {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        category:category_id(id, name),
        allocations(*, employee:employee_id(name), department:department_id(name), created_by_emp:created_by(name)),
        maintenance_requests(*, raised_by_emp:raised_by(name), approved_by_emp:approved_by(name))
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Register a new asset — asset_tag generated server-side via DB trigger/sequence
  async create(payload) {
    const { data, error } = await supabase
      .from('assets')
      .insert({ ...payload, status: 'Available' })
      .select()
      .single()
    return { data, error }
  },

  // Update an asset
  async update(id, payload) {
    const { data, error } = await supabase
      .from('assets')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  // Get all bookable assets (is_bookable = true)
  async getBookable() {
    const { data, error } = await supabase
      .from('assets')
      .select('id, name, asset_tag, location, status')
      .eq('is_bookable', true)
      .neq('status', 'Retired')
      .neq('status', 'Disposed')
      .order('name')
    return { data, error }
  },
}
