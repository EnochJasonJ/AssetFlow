// AppLayout — wraps every authenticated page with Sidebar + Topbar
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'

export default function AppLayout({ title, actions, children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-right">
            <NotificationBell />
            {actions}
          </div>
        </header>
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  )
}
