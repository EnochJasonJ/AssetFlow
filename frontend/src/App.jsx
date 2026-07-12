// App.jsx — Router setup
// Hari owns this file — all teammates register their routes here
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// ─── Auth pages (Hari) ────────────────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// ─── Hari's pages ─────────────────────────────────────────────────────────────
import DashboardPage from './pages/dashboard/DashboardPage'
import OrgSetupPage from './pages/org/OrgSetupPage'

// ─── Devipriya's pages ────────────────────────────────────────────────────────
import AssetDirectoryPage from './pages/assets/AssetDirectoryPage'
// import BookingPage from './pages/bookings/BookingPage'       // Devipriya — Screen 6
// import ReportsPage from './pages/reports/ReportsPage'         // Devipriya — Screen 9
// import ActivityLogsPage from './pages/logs/ActivityLogsPage'  // Devipriya — Screen 10

// ─── Abinivas' pages ──────────────────────────────────────────────────────────
import AllocationPage from './pages/allocations/AllocationPage'
import MaintenancePage from './pages/maintenance/MaintenancePage'
import AuditPage from './pages/audit/AuditPage'

// ─── Fallback placeholder ─────────────────────────────────────────────────────
import PlaceholderPage from './pages/PlaceholderPage'

// ─── Route guards ─────────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
      <div className="spinner" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'Admin') return <Navigate to="/dashboard" replace />
  return children
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/signup"         element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Hari — Screens 1, 2, 3 */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/org"       element={<PrivateRoute><AdminRoute><OrgSetupPage /></AdminRoute></PrivateRoute>} />

          {/* Devipriya — Screens 4, 6, 9, 10 */}
          <Route path="/assets"  element={<PrivateRoute><AssetDirectoryPage /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><PlaceholderPage name="Resource Booking" owner="Devipriya" screen={6} /></PrivateRoute>} />
          <Route path="/reports"  element={<PrivateRoute><PlaceholderPage name="Reports & Analytics" owner="Devipriya" screen={9} /></PrivateRoute>} />
          <Route path="/logs"     element={<PrivateRoute><PlaceholderPage name="Activity Logs" owner="Devipriya" screen={10} /></PrivateRoute>} />

          {/* Abinivas — Screens 5, 7, 8 */}
          <Route path="/allocations" element={<PrivateRoute><AllocationPage /></PrivateRoute>} />
          <Route path="/maintenance" element={<PrivateRoute><MaintenancePage /></PrivateRoute>} />
          <Route path="/audit"       element={<PrivateRoute><AuditPage /></PrivateRoute>} />

          {/* Default */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
