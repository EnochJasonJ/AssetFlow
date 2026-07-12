// PlaceholderPage — shown for screens not yet built by teammates
// Replace by importing the real page when it's ready
import AppLayout from '../components/shared/AppLayout'

export default function PlaceholderPage({ name, owner, screen }) {
  return (
    <AppLayout title={name}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Screen {screen} — {name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Being built by <strong style={{ color: 'var(--accent)' }}>{owner}</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            This route is registered and ready — replace this component in <code>App.jsx</code> when the page is complete.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
