import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Abinivas pages (will be filled in as each part is built)
import AllocationPage from './pages/allocations/AllocationPage'
import MaintenancePage from './pages/maintenance/MaintenancePage'
import AuditPage from './pages/audit/AuditPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to allocations for now */}
        <Route path="/" element={<Navigate to="/allocations" replace />} />

        {/* Abinivas — Screen 5, 7, 8 */}
        <Route path="/allocations" element={<AllocationPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audit" element={<AuditPage />} />

        {/* TODO: Hari — /login, /signup, /dashboard, /org */}
        {/* TODO: Devipriya — /assets, /bookings, /reports, /logs */}
      </Routes>
    </BrowserRouter>
// App.jsx — Router setup
// Hari sets up all routes here. Each teammate adds their own page imports.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth pages (Hari)
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'

// Hari's pages
import DashboardPage from './pages/dashboard/DashboardPage'
import OrgSetupPage from './pages/org/OrgSetupPage'

// Placeholders for teammates' pages (replace when they build them)
import PlaceholderPage from './pages/PlaceholderPage'

// Route guard — redirects to /login if not authenticated
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

// Admin-only route guard
function AdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'Admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected — Hari */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/org"       element={<PrivateRoute><AdminRoute><OrgSetupPage /></AdminRoute></PrivateRoute>} />

          {/* Protected — Devipriya (placeholders until she builds them) */}
          <Route path="/assets"      element={<PrivateRoute><PlaceholderPage name="Asset Directory" owner="Devipriya" screen={4} /></PrivateRoute>} />
          <Route path="/bookings"    element={<PrivateRoute><PlaceholderPage name="Resource Booking" owner="Devipriya" screen={6} /></PrivateRoute>} />
          <Route path="/reports"     element={<PrivateRoute><PlaceholderPage name="Reports & Analytics" owner="Devipriya" screen={9} /></PrivateRoute>} />
          <Route path="/logs"        element={<PrivateRoute><PlaceholderPage name="Activity Logs" owner="Devipriya" screen={10} /></PrivateRoute>} />

          {/* Protected — Abinivas (placeholders until he builds them) */}
          <Route path="/allocations" element={<PrivateRoute><PlaceholderPage name="Asset Allocation & Transfer" owner="Abinivas" screen={5} /></PrivateRoute>} />
          <Route path="/maintenance" element={<PrivateRoute><PlaceholderPage name="Maintenance Management" owner="Abinivas" screen={7} /></PrivateRoute>} />
          <Route path="/audit"       element={<PrivateRoute><PlaceholderPage name="Asset Audit" owner="Abinivas" screen={8} /></PrivateRoute>} />

          {/* Default */}
          <Route path="/"    element={<Navigate to="/dashboard" replace />} />
          <Route path="*"    element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
