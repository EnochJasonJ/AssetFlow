/**
 * maintenance.js — Service layer for Screen 7: Maintenance Management
 *
 * All API calls go to /api/v1/maintenance.
 * Status flow: Pending → Approved | Rejected → TechnicianAssigned → InProgress → Resolved
 *
 * Business rule: Asset status flips to UnderMaintenance on APPROVED, not on raise.
 * This is enforced server-side; frontend just shows the current state.
 */

import { supabase } from '../lib/supabase'

const BASE = '/api/v1'

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

/**
 * GET /api/v1/maintenance
 * Returns all maintenance requests across all assets.
 * Query: ?status=Pending&asset_id=uuid (both optional)
 */
export async function getMaintenanceRequests(filters = {}) {
  const headers = await authHeader()
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.assetId) params.set('asset_id', filters.assetId)
  const query = params.toString() ? `?${params}` : ''
  const res = await fetch(`${BASE}/maintenance${query}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch maintenance requests: ${res.status}`)
  return res.json()
}

/**
 * POST /api/v1/maintenance
 * Employee or Asset Manager raises a new maintenance request.
 * Asset stays at current status until APPROVED.
 *
 * @param {{ assetId: string, issueDescription: string, priority: 'Low'|'Medium'|'High'|'Critical', photoUrl?: string }} payload
 */
export async function raiseRequest(payload) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/maintenance`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset_id: payload.assetId,
      issue_description: payload.issueDescription,
      priority: payload.priority,
      photo_url: payload.photoUrl ?? null,
    }),
  })
  if (!res.ok) throw new Error(`Failed to raise maintenance request: ${res.status}`)
  return res.json()
}

/**
 * PATCH /api/v1/maintenance/:id/status
 * Update the status of a maintenance request (Asset Manager).
 *
 * Allowed transitions:
 *   Pending → Approved (asset flips to UnderMaintenance server-side)
 *   Pending → Rejected (asset status unchanged)
 *   Approved → TechnicianAssigned (technician_name required)
 *   TechnicianAssigned → InProgress
 *   InProgress → Resolved (asset flips back to Available/Allocated server-side)
 *
 * @param {string} id
 * @param {{ status: string, technicianName?: string }} payload
 */
export async function updateStatus(id, payload) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const body = { status: payload.status }
  if (payload.technicianName) body.technician_name = payload.technicianName

  const res = await fetch(`${BASE}/maintenance/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Status update failed: ${res.status}`)
  return res.json()
}

/**
 * GET /api/v1/maintenance/:id
 * Get details for a single maintenance request.
 */
export async function getMaintenanceById(id) {
  const headers = await authHeader()
  const res = await fetch(`${BASE}/maintenance/${id}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch maintenance request: ${res.status}`)
  return res.json()
}
