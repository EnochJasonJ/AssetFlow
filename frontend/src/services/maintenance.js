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
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL

async function authHeader() {
  if (DEV_MODE) return { Authorization: 'Bearer dev-token' }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

const MOCK_MAINTENANCE = [
  { id: '1', asset: { name: 'MacBook Pro 14"', asset_tag: 'AF-0001' }, issue_description: 'Screen flickering intermittently', priority: 'High', status: 'Pending', raised_by: { name: 'Devipriya' }, raised_at: new Date(Date.now() - 2 * 86400000).toISOString(), technician_name: null },
  { id: '2', asset: { name: 'Projector', asset_tag: 'AF-0005' }, issue_description: 'Lamp needs replacement', priority: 'Medium', status: 'Approved', raised_by: { name: 'Hari' }, raised_at: new Date(Date.now() - 5 * 86400000).toISOString(), technician_name: null },
  { id: '3', asset: { name: 'AC Unit - Floor 2', asset_tag: 'AF-0008' }, issue_description: 'Not cooling properly', priority: 'Critical', status: 'TechnicianAssigned', raised_by: { name: 'Abinivas' }, raised_at: new Date(Date.now() - 7 * 86400000).toISOString(), technician_name: 'Rajesh Kumar' },
  { id: '4', asset: { name: 'Office Chair', asset_tag: 'AF-0012' }, issue_description: 'Armrest broken', priority: 'Low', status: 'Resolved', raised_by: { name: 'Hari' }, raised_at: new Date(Date.now() - 15 * 86400000).toISOString(), technician_name: 'Facilities Team' },
  { id: '5', asset: { name: 'Dell Monitor 27"', asset_tag: 'AF-0002' }, issue_description: 'Dead pixels', priority: 'Medium', status: 'Rejected', raised_by: { name: 'Devipriya' }, raised_at: new Date(Date.now() - 3 * 86400000).toISOString(), technician_name: null },
]

export async function getMaintenanceRequests(filters = {}) {
  if (DEV_MODE) {
    let data = MOCK_MAINTENANCE
    if (filters.status) data = data.filter(m => m.status === filters.status)
    return data
  }
  try {
    const headers = await authHeader()
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.assetId) params.set('asset_id', filters.assetId)
    const query = params.toString() ? `?${params}` : ''
    const res = await fetch(`${BASE}/maintenance${query}`, { headers })
    if (!res.ok) throw new Error(res.status)
    return res.json()
  } catch { return MOCK_MAINTENANCE }
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
