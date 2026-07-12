// NotificationBell — top-bar bell icon with unread count badge
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function NotificationBell() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user || !import.meta.env.VITE_SUPABASE_URL) return
    fetchCount()
    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `employee_id=eq.${user.id}` }, () => fetchCount())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchCount() {
    if (!import.meta.env.VITE_SUPABASE_URL) return
    const { count: c } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', user.id)
      .is('read_at', null)
    setCount(c ?? 0)
  }

  return (
    <button className="notif-btn" title="Notifications" onClick={() => {}}>
      🔔
      {count > 0 && <span className="notif-badge">{count > 99 ? '99+' : count}</span>}
    </button>
  )
}
