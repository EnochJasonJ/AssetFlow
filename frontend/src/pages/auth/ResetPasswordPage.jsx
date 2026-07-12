// Reset Password Page — handles the Supabase password-reset email link
// Supabase redirects here after user clicks the reset link in their email
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(false)

  // Supabase puts the access token in the URL hash — exchange it for a session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true)
      else setError('This reset link is invalid or has expired. Please request a new one.')
    })
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: form.password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (done) return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo"><h1>AssetFlow</h1></div>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2>Password updated!</h2>
          <p className="sub" style={{ marginTop: '0.5rem' }}>
            Your password has been reset successfully. Redirecting you to login…
          </p>
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
          <h2>Set new password</h2>
          <p className="sub">Enter a new password for your account.</p>

          {error && (
            <div className="alert alert-error">
              {error}
              {!validSession && (
                <span
                  onClick={() => navigate('/login')}
                  style={{ marginLeft: '0.5rem', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Go to login →
                </span>
              )}
            </div>
          )}

          {validSession && (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label htmlFor="rp-pw">New password</label>
                <input
                  id="rp-pw"
                  type="password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="rp-cpw">Confirm new password</label>
                <input
                  id="rp-cpw"
                  type="password"
                  placeholder="Same as above"
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading ? <span className="spinner" style={{ margin: '0 auto' }} /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
