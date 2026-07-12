// RoleGuard — wraps content that should only be visible to certain roles
// Usage: <RoleGuard roles={['Admin']}><AdminOnlyComponent /></RoleGuard>
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RoleGuard({ roles, children, fallback = <Navigate to="/dashboard" replace /> }) {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile.role)) return fallback

  return children
}
