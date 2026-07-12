/**
 * allocations.js — Service layer for Screen 5: Asset Allocation & Transfer
 * Calls /api/v1/... (backend owned by Jason).
 * Falls back to mock data when backend is not running.
 */

import { supabase } from '../lib/supabase'

const BASE = '/api/v1'
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL

async function authHeader() {
  const localToken = localStorage.getItem('access_token')
  if (localToken) return { Authorization: `Bearer ${localToken}` }
  if (DEV_MODE) return { Authorization: 'Bearer dev-token' }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

const MOCK_ALLOCATIONS = [
  { id: '1', asset_id: 'a1', asset: { name: 'MacBook Pro 14"', asset_tag: 'AF-0001' }, assigned_to_user: { name: 'Devipriya' }, assigned_to_department: null, status: 'Active', allocated_at: new Date(Date.now() - 5 * 86400000).toISOString(), expected_return_date: new Date(Date.now() + 10 * 86400000).toISOString() },
  { id: '2', asset_id: 'a2', asset: { name: 'Dell Monitor 27"', asset_tag: 'AF-0002' }, assigned_to_user: { name: 'Abinivas' }, assigned_to_department: null, status: 'Active', allocated_at: new Date(Date.now() - 20 * 86400000).toISOString(), expected_return_date: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: '3', asset_id: 'a3', asset: { name: 'Standing Desk', asset_tag: 'AF-0003' }, assigned_to_user: null, assigned_to_department: { name: 'Engineering' }, status: 'Returned', allocated_at: new Date(Date.now() - 60 * 86400000).toISOString(), expected_return_date: new Date(Date.now() - 30 * 86400000).toISOString() },
]


export async function getAllocations() {
  try {
    const headers = await authHeader()
    const res = await fetch(`${BASE}/allocations`, { headers })
    if (res.ok) {
      const data = await res.json()
      const list = data.data || data
      if (Array.isArray(list)) return list
    }
  } catch (e) {
    console.warn('API getAllocations failed:', e)
  }
  return MOCK_ALLOCATIONS
}

/**
 * GET /api/v1/allocations?asset_id=:assetId
 * Returns allocation history for a specific asset.
 */
export async function getAllocationsByAsset(assetId) {
  const headers = await authHeader()
  const res = await fetch(`${BASE}/allocations?asset_id=${assetId}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch asset allocations: ${res.status}`)
  return res.json()
}

/**
 * POST /api/v1/allocations
 * Allocates an asset to an employee or department.
 *
 * Returns 409 with { error, held_by: { id, name, email } } if already allocated.
 * Caller must handle 409 and show the conflict message + Transfer button.
 *
 * @param {{ assetId: string, assignedToUserId: string|null, assignedToDepartmentId: string|null, expectedReturnDate: string|null }} payload
 */
export async function allocateAsset(payload) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/allocations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset_id: payload.assetId,
      assigned_to_user_id: payload.assignedToUserId ?? null,
      assigned_to_department_id: payload.assignedToDepartmentId ?? null,
      expected_return_date: payload.expectedReturnDate ?? null,
    }),
  })

  if (res.status === 409) {
    // Return the full conflict payload so the UI can show who holds it
    const conflict = await res.json()
    const err = new Error('Asset already allocated')
    err.conflict = conflict
    err.status = 409
    throw err
  }

  if (!res.ok) throw new Error(`Allocation failed: ${res.status}`)
  return res.json()
}

/**
 * POST /api/v1/transfers
 * Raises a transfer request for an asset currently held by someone else.
 *
 * @param {{ assetId: string, reason: string }} payload
 */
export async function requestTransfer(payload) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/transfers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      asset_id: payload.assetId,
      reason: payload.reason,
    }),
  })
  if (!res.ok) throw new Error(`Transfer request failed: ${res.status}`)
  return res.json()
}

/**
 * PATCH /api/v1/transfers/:id/approve
 * Approve a pending transfer request (Asset Manager / Dept Head).
 *
 * @param {string} transferId
 */
export async function approveTransfer(transferId) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/transfers/${transferId}/approve`, {
    method: 'PATCH',
    headers,
  })
  if (!res.ok) throw new Error(`Transfer approval failed: ${res.status}`)
  return res.json()
}

/**
 * PATCH /api/v1/transfers/:id/reject
 * Reject a pending transfer request.
 *
 * @param {string} transferId
 */
export async function rejectTransfer(transferId) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/transfers/${transferId}/reject`, {
    method: 'PATCH',
    headers,
  })
  if (!res.ok) throw new Error(`Transfer rejection failed: ${res.status}`)
  return res.json()
}

/**
 * PATCH /api/v1/allocations/:id/return
 * Returns an asset. Requires condition notes (Asset Manager approves check-in).
 *
 * @param {string} allocationId
 * @param {{ conditionNotes: string }} payload
 */
export async function returnAsset(allocationId, payload) {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' }
  const res = await fetch(`${BASE}/allocations/${allocationId}/return`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ condition_notes: payload.conditionNotes }),
  })
  if (!res.ok) throw new Error(`Return failed: ${res.status}`)
  return res.json()
}

/**
 * GET /api/v1/transfers?status=Requested
 * Returns pending transfer requests (for Asset Managers to review).
 */
export async function getPendingTransfers() {
  const headers = await authHeader()
  const res = await fetch(`${BASE}/transfers?status=Requested`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch transfers: ${res.status}`)
  return res.json()
}
