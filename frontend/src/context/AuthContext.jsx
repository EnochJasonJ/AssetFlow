// Auth context — provides user, role, loading to the whole app
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// ─── DEV BYPASS ───────────────────────────────────────────────────────────────
// When Supabase env vars are missing (no .env file), use a mock Admin user
// so the full UI is visible without a real login.
// Remove DEV_MODE or set VITE_SUPABASE_URL in .env to disable this.
const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL
const MOCK_USER = { id: 'dev-user-001', email: 'hari@assetflow.dev' }
const MOCK_PROFILE = { id: 'dev-user-001', name: 'Hari (Dev)', email: 'hari@assetflow.dev', role: 'Admin', department_id: null, status: 'Active' }
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(DEV_MODE ? MOCK_USER : null)
  const [profile, setProfile] = useState(DEV_MODE ? MOCK_PROFILE : null)
  const [loading, setLoading] = useState(!DEV_MODE) // skip loading in dev mode

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('employees')
      .select('id, name, email, role, department_id, status')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    if (DEV_MODE) return // skip Supabase calls entirely in dev mode

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (DEV_MODE) return // no-op in dev mode
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
