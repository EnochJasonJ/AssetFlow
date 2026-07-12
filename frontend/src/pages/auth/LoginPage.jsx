// Screen 1 — Login Page
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/dashboard')
  }

  const handleForgot = async () => {
    if (!form.email) { setError('Enter your email first.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) setError(err.message)
    else setError('✓ Password reset link sent — check your email.')
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>AssetFlow</h1>
          <p>Enterprise Asset & Resource Management</p>
        </div>

        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="sub">Sign in to your account to continue</p>

          {error && (
            <div className={`alert ${error.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="current-password"
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
              <button type="button" onClick={handleForgot}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          New here?&ensp;
          <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Create an account
          </Link>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Admin roles are assigned by your organization admin — not during signup.
          </div>
        </div>
      </div>
    </div>
  )
}
