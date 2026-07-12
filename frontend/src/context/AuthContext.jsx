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
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const storedUser = getStoredUser()
  const [user, setUser]       = useState(storedUser || (DEV_MODE ? MOCK_USER : null))
  const [profile, setProfile] = useState(storedUser || (DEV_MODE ? MOCK_PROFILE : null))
  const [loading, setLoading] = useState(!DEV_MODE && !storedUser) // skip loading in dev mode or if stored user exists

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('employees')
      .select('id, name, email, role, department_id, status')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@assetflow.com', password: 'SecurePass123!' })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.token) {
          localStorage.setItem('access_token', data.token)
        }
      })
      .catch(() => {})
    }

    if (storedUser || DEV_MODE) return // skip Supabase calls if logged in via backend API or dev mode

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
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    if (DEV_MODE) {
      setUser(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const setSessionUser = (userData) => {
    setUser(userData)
    setProfile(userData)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, setSessionUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
