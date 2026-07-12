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

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

/**
 * GET /api/v1/audits
 * Returns all audit cycles (Open and Closed), latest first.
 */
export async function getAuditCycles() {
  const headers = await authHeader()
  const res = await fetch(`${BASE}/audits`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch audit cycles: ${res.status}`)
  return res.json()
}

/**
 * GET /api/v1/audits/:id
 * Returns a single audit cycle with its auditors and summary counts.
 */
export async function getAuditCycleById(id) {
  const headers = await authHeader()
  const res = await fetch(`${BASE}/audits/${id}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch audit cycle: ${res.status}`)
  return res.json()
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
  const headers = await authHeader()
  const res = await fetch(`${BASE}/audits/${cycleId}/items`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch audit items: ${res.status}`)
  return res.json()
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
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/audits/${cycleId}/items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset_id: payload.assetId,
      status_found: payload.result,
      notes: payload.notes ?? null,
    }),
  })
  if (!res.ok) throw new Error(`Failed to log audit item: ${res.status}`)
  return res.json()
}

/**
 * PATCH /api/v1/audits/:id/close
 * ATOMIC: locks the cycle AND transitions Missing assets to Lost.
 * This is irreversible — always show a ConfirmDialog before calling this.
 *
 * Returns: discrepancy report summary { missing_count, damaged_count, discrepancies: [...] }
 */
export async function closeAuditCycle(cycleId) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/audits/${cycleId}/close`, {
    method: 'PATCH',
    headers,
  })
  if (!res.ok) throw new Error(`Failed to close audit cycle: ${res.status}`)
  return res.json()
}
