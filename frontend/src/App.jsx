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
  )
}

export default App
