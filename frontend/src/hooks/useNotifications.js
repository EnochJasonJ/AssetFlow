// useNotifications — realtime notification count + list for current user
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { reportService } from '../services/reportService'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const { data } = await reportService.getNotifications(profile.id)
    const list = data ?? []
    setNotifications(list)
    setUnreadCount(list.filter(n => !n.read_at).length)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    fetchNotifications()
    if (!profile?.id) return
    // Realtime subscription — auto-refresh when new notifications arrive
    const channel = supabase
      .channel(`notif-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `employee_id=eq.${profile.id}`,
      }, fetchNotifications)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchNotifications, profile?.id])

  const markRead = async (id) => {
    await reportService.markNotificationRead(id)
    fetchNotifications()
  }

  const markAllRead = async () => {
    await reportService.markAllNotificationsRead(profile.id)
    fetchNotifications()
  }

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications }
}
