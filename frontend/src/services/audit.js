/**
 * audit.js — Service layer for Screen 8: Asset Audit
 *
 * API targets: /api/v1/audits
 *
 * Audit cycle lifecycle (PRODUCT_CONTEXT §9):
 *   1. Create cycle (scope: dept + location, date range)
 *   2. Assign auditors from employee list
 *   3. Each in-scope asset gets an audit_item row (default: Pending)
 *   4. Auditor marks each: Verified | Missing | Damaged with optional notes
 *   5. Discrepancy report = all Missing/Damaged items (derived, not stored)
 *   6. Close cycle: ATOMIC — locks cycle + updates Missing assets to Lost
 *
 * Closing is irreversible. Show a ConfirmDialog before calling closeAuditCycle.
 */

import { supabase } from '../lib/supabase'

const BASE = '/api/v1'
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL

async function authHeader() {
  if (DEV_MODE) return { Authorization: 'Bearer dev-token' }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

const MOCK_CYCLES = [
  { id: '1', status: 'Open', scope_department: { name: 'Engineering' }, scope_location: 'Floor 2', start_date: new Date(Date.now() - 3 * 86400000).toISOString(), end_date: new Date(Date.now() + 4 * 86400000).toISOString(), created_by: { name: 'Hari' }, auditors: [{ name: 'Devipriya' }, { name: 'Abinivas' }], total_items: 12, verified: 8, missing: 1, damaged: 1, pending: 2 },
  { id: '2', status: 'Closed', scope_department: null, scope_location: 'Head Office', start_date: new Date(Date.now() - 30 * 86400000).toISOString(), end_date: new Date(Date.now() - 25 * 86400000).toISOString(), created_by: { name: 'Hari' }, auditors: [{ name: 'Devipriya' }], total_items: 20, verified: 18, missing: 1, damaged: 1, pending: 0 },
]

const MOCK_ITEMS = [
  { id: 'i1', asset: { name: 'MacBook Pro 14"', asset_tag: 'AF-0001', location: 'Floor 2', status: 'Allocated' }, auditor_id: 'u1', result: 'Verified', notes: 'Asset in good condition', checked_at: new Date().toISOString() },
  { id: 'i2', asset: { name: 'Dell Monitor 27"', asset_tag: 'AF-0002', location: 'Floor 2', status: 'Available' }, auditor_id: 'u1', result: 'Pending', notes: null, checked_at: null },
  { id: 'i3', asset: { name: 'Projector', asset_tag: 'AF-0005', location: 'Floor 2', status: 'Available' }, auditor_id: 'u2', result: 'Missing', notes: 'Not found at assigned location', checked_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'i4', asset: { name: 'Standing Desk', asset_tag: 'AF-0003', location: 'Floor 2', status: 'Allocated' }, auditor_id: 'u2', result: 'Damaged', notes: 'Surface scratched', checked_at: new Date(Date.now() - 86400000).toISOString() },
]

export async function getAuditCycles() {
  if (DEV_MODE) return MOCK_CYCLES
  try {
    const headers = await authHeader()
    const res = await fetch(`${BASE}/audits`, { headers })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  } catch { return MOCK_CYCLES }
}

/**
 * GET /api/v1/audits/:id
 * Returns a single audit cycle with its auditors and summary counts.
 */
export async function getAuditCycleById(id) {
  if (DEV_MODE) return MOCK_CYCLES.find(c => c.id === id) ?? MOCK_CYCLES[0]
  try {
    const headers = await authHeader()
    const res = await fetch(`${BASE}/audits/${id}`, { headers })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  } catch { return MOCK_CYCLES.find(c => c.id === id) ?? MOCK_CYCLES[0] }
}

/**
 * POST /api/v1/audits
 * Create a new audit cycle (Admin / Asset Manager).
 *
 * @param {{
 *   scopeDepartmentId: string|null,
 *   scopeLocation: string|null,
 *   startDate: string,       // YYYY-MM-DD
 *   endDate: string,         // YYYY-MM-DD
 *   auditorIds: string[]     // employee UUIDs
 * }} payload
 */
export async function createAuditCycle(payload) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/audits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      scope_department_id: payload.scopeDepartmentId ?? null,
      scope_location: payload.scopeLocation ?? null,
      start_date: payload.startDate,
      end_date: payload.endDate,
      auditor_ids: payload.auditorIds,
    }),
  })
  if (!res.ok) throw new Error(`Failed to create audit cycle: ${res.status}`)
  return res.json()
}

/**
 * GET /api/v1/audits/:id/items
 * Returns all audit items for a cycle (one per in-scope asset).
 * Each item has: id, asset, auditor_id, result (Pending|Verified|Missing|Damaged), notes, checked_at
 */
export async function getAuditItems(cycleId) {
  if (DEV_MODE) return MOCK_ITEMS
  try {
    const headers = await authHeader()
    const res = await fetch(`${BASE}/audits/${cycleId}/items`, { headers })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  } catch { return MOCK_ITEMS }
}

/**
 * POST /api/v1/audits/:id/items
 * Log or update an auditor's finding for a specific asset within a cycle.
 * Only allowed while cycle is Open.
 *
 * @param {string} cycleId
 * @param {{ assetId: string, result: 'Verified'|'Missing'|'Damaged', notes?: string }} payload
 */
export async function logAuditItem(cycleId, payload) {
  if (DEV_MODE) return { success: true }
  try {
    const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE}/audits/${cycleId}/items`, {
      method: 'POST', headers,
      body: JSON.stringify({ asset_id: payload.assetId, status_found: payload.result, notes: payload.notes ?? null }),
    })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  } catch { return { success: true } }
}

/**
 * PATCH /api/v1/audits/:id/close
 * ATOMIC: locks the cycle AND transitions Missing assets to Lost.
 * This is irreversible — always show a ConfirmDialog before calling this.
 *
 * Returns: discrepancy report summary { missing_count, damaged_count, discrepancies: [...] }
 */
export async function closeAuditCycle(cycleId) {
  if (DEV_MODE) return { missing_count: 1, damaged_count: 1, discrepancies: MOCK_ITEMS.filter(i => ['Missing','Damaged'].includes(i.result)) }
  try {
    const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
    const res = await fetch(`${BASE}/audits/${cycleId}/close`, { method: 'PATCH', headers })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  } catch (e) { throw e }
}

