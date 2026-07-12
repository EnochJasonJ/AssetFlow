// Screen 1 — Signup Page (Employee only — no role picker)
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)

    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
  }

  if (success) return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo"><h1>AssetFlow</h1></div>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2>Account created!</h2>
          <p className="sub" style={{ marginTop: '0.5rem' }}>
            Check your email to confirm your account. Your role will be set to <strong>Employee</strong> by default.
            An admin can upgrade your role from the Employee Directory.
          </p>
          <Link to="/login">
            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>Go to Login</button>
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>AssetFlow</h1>
          <p>Enterprise Asset & Resource Management</p>
        </div>

        <div className="auth-card">
          <h2>Create an account</h2>
          <p className="sub">An employee account will be created. Admin roles are assigned separately.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="signup-name">Full name</label>
              <input id="signup-name" type="text" placeholder="Jane Doe" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Work email</label>
              <input id="signup-email" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="signup-pw">Password</label>
                <input id="signup-pw" type="password" placeholder="Min 8 chars" value={form.password} onChange={set('password')} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="signup-cpw">Confirm password</label>
                <input id="signup-cpw" type="password" placeholder="Same as above" value={form.confirm} onChange={set('confirm')} required />
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', marginTop: '0.25rem', border: '1px solid var(--border)' }}>
              ℹ️ Signing up creates an <strong style={{ color: 'var(--text-secondary)' }}>Employee</strong> account. No role picker — admin roles are assigned by your organization admin later.
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Already have an account?&ensp;
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
