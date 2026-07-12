// src/services/logs.js
import { supabase } from '../lib/supabase'

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    employee_id: 'current-user',
    type: 'AssetAssigned',
    message: 'Asset MacBook Pro M3 16" (AF-0001) has been assigned to you.',
    related_entity_type: 'asset',
    related_entity_id: 'asset-1',
    read_at: null,
    created_at: '2026-07-12T10:15:00Z'
  },
  {
    id: 'notif-2',
    employee_id: 'current-user',
    type: 'MaintenanceApproved',
    message: 'Maintenance request for Toyota Prius (AF-0004) has been Approved by the Asset Manager.',
    related_entity_type: 'maintenance',
    related_entity_id: 'maint-1',
    read_at: '2026-07-12T11:00:00Z',
    created_at: '2026-07-12T10:00:00Z'
  },
  {
    id: 'notif-3',
    employee_id: 'current-user',
    type: 'BookingConfirmed',
    message: 'Booking for Conference Room Projector (AF-0003) is confirmed for 2026-07-12 14:00 - 16:00.',
    related_entity_type: 'booking',
    related_entity_id: 'booking-2',
    read_at: null,
    created_at: '2026-07-12T08:05:00Z'
  }
]

const INITIAL_LOGS = [
  {
    id: 'log-1',
    actor_id: 'usr-1',
    actor_name: 'Jason (Backend)',
    action: 'Prisma Migration Run',
    entity_type: 'database',
    entity_id: 'db-schema',
    metadata: { version: '20260712051002_db_uuid' },
    created_at: '2026-07-12T11:23:00Z'
  },
  {
    id: 'log-2',
    actor_id: 'usr-2',
    actor_name: 'Hari (Frontend)',
    action: 'App Layout Setup',
    entity_type: 'ui',
    entity_id: 'app-router',
    metadata: { screens: ['Screen 1', 'Screen 2', 'Screen 3'] },
    created_at: '2026-07-12T12:03:00Z'
  },
  {
    id: 'log-3',
    actor_id: 'usr-3',
    actor_name: 'Devipriya',
    action: 'Asset Registered',
    entity_type: 'asset',
    entity_id: 'asset-1',
    metadata: { tag: 'AF-0001', name: 'MacBook Pro M3 16"' },
    created_at: '2026-07-12T12:36:00Z'
  },
  {
    id: 'log-4',
    actor_id: 'usr-4',
    actor_name: 'Alice Johnson',
    action: 'Resource Booked',
    entity_type: 'booking',
    entity_id: 'booking-2',
    metadata: { asset: 'Conference Room Projector', start: '14:00', end: '16:00' },
    created_at: '2026-07-12T12:40:00Z'
  }
]

function getStorage(key, fallback) {
  const data = localStorage.getItem(key)
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
  return JSON.parse(data)
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const isSupabaseValid = () => {
  return supabase.supabaseUrl && !supabase.supabaseUrl.includes('your-project.supabase.co')
}

function getAuthHeaders() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

export async function getNotifications() {
  try {
    const res = await fetch('/api/v1/notifications', { headers: getAuthHeaders() })
    if (res.ok) {
      const data = await res.json()
      const list = data.data || data
      if (Array.isArray(list)) return list
    }
  } catch (e) {
    console.warn('API getNotifications failed:', e)
  }
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) return data
    } catch (e) {
      console.warn('Supabase getNotifications failed, falling back to mock:', e)
    }
  }
  return getStorage('af_notifications', INITIAL_NOTIFICATIONS)
}

export async function markNotificationRead(id) {
  try {
    await fetch(`/api/v1/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    })
  } catch (e) {
    console.warn('API markNotificationRead failed:', e)
  }
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .select()
      if (!error && data) return data[0]
    } catch (e) {
      console.warn('Supabase markNotificationRead failed, falling back to mock:', e)
    }
  }

  const notifications = getStorage('af_notifications', INITIAL_NOTIFICATIONS)
  const idx = notifications.findIndex(n => n.id === id)
  if (idx !== -1) {
    notifications[idx].read_at = new Date().toISOString()
    setStorage('af_notifications', notifications)
  }
}

export async function markAllNotificationsRead() {
  try {
    await fetch('/api/v1/notifications/read-all', {
      method: 'PUT',
      headers: getAuthHeaders()
    })
  } catch (e) {
    console.warn('API markAllNotificationsRead failed:', e)
  }
  if (isSupabaseValid()) {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null)
    } catch (e) {
      console.warn('Supabase markAllNotificationsRead failed, falling back to mock:', e)
    }
  }

  const notifications = getStorage('af_notifications', INITIAL_NOTIFICATIONS)
  const updated = notifications.map(n => ({
    ...n,
    read_at: n.read_at || new Date().toISOString()
  }))
  setStorage('af_notifications', updated)
}

export async function getActivityLogs() {
  try {
    const res = await fetch('/api/v1/logs', { headers: getAuthHeaders() })
    if (res.ok) {
      const data = await res.json()
      const list = data.data || data
      if (Array.isArray(list)) return list
    }
  } catch (e) {
    console.warn('API getActivityLogs failed:', e)
  }
  if (isSupabaseValid()) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, employees(name)')
        .order('created_at', { ascending: false })
      if (!error && data) {
        return data.map(item => ({
          ...item,
          actor_name: item.employees?.name || 'System'
        }))
      }
    } catch (e) {
      console.warn('Supabase getActivityLogs failed, falling back to mock:', e)
    }
  }

  return getStorage('af_logs', INITIAL_LOGS)
}
