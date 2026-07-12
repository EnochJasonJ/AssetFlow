// Sidebar — left navigation, role-aware
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard',    icon: '🏠', label: 'Dashboard',    roles: null },
  { to: '/assets',       icon: '📦', label: 'Assets',       roles: null },
  { to: '/allocations',  icon: '🔗', label: 'Allocation',   roles: null },
  { to: '/bookings',     icon: '📅', label: 'Bookings',      roles: null },
  { to: '/maintenance',  icon: '🔧', label: 'Maintenance',  roles: null },
  { to: '/audit',        icon: '🔍', label: 'Audit',         roles: ['Admin','AssetManager'] },
  { to: '/reports',      icon: '📊', label: 'Reports',       roles: ['Admin','AssetManager','DepartmentHead'] },
  { to: '/logs',         icon: '📋', label: 'Activity Logs', roles: null },
  { to: '/org',          icon: '🏢', label: 'Org Setup',     roles: ['Admin'] },
]

const ROLE_LABEL = {
  Admin:          { label: 'Admin',           cls: 'role-admin' },
  AssetManager:   { label: 'Asset Manager',   cls: 'role-manager' },
  DepartmentHead: { label: 'Dept. Head',       cls: 'role-head' },
  Employee:       { label: 'Employee',         cls: 'role-employee' },
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const visible = NAV.filter(n => !n.roles || (role && n.roles.includes(role)))
  const rl = ROLE_LABEL[role] ?? { label: role, cls: 'role-employee' }
  const initials = profile?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>AssetFlow</h1>
        <span>Enterprise Asset Management</span>
      </div>

      <div className="sidebar-section">Navigation</div>

      {visible.map(n => (
        <NavLink
          key={n.to}
          to={n.to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{n.icon}</span>
          {n.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name ?? 'Loading…'}
            </div>
            <div className={`user-role ${rl.cls}`}>{rl.label}</div>
          </div>
          <button className="btn-ghost" style={{ padding: '0.25rem', fontSize: '0.9rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onClick={handleSignOut} title="Sign out">⏏</button>
        </div>
      </div>
    </aside>
  )
}
