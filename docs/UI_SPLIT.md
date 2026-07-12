# AssetFlow — UI Split Plan

> **Last updated:** 2026-07-12 by Hari
> This document defines who builds which screens for the frontend UI.
> Each person works in `/frontend/src/` under their own folder structure.
> **Reference wireframe:** `docs/AssetFlow - Enterprise Asset & Resource Management System - 8 hours.excalidraw`
> **Backend:** Fully handled by Jason — frontend team does NOT touch `/backend`.

---

## Team

| Name | Role | Screens |
|---|---|---|
| **Hari** | Frontend | Screen 1 · Screen 2 · Screen 3 · All Shared Components |
| **Devipriya** | Frontend | Screen 4 · Screen 6 · Screen 9 · Screen 10 |
| **Abinivas** | Frontend | Screen 5 · Screen 7 · Screen 8 |
| **Jason** | Backend | All of `/backend` — API, DB, Auth, Prisma |

---

## Screen Split

### 👤 Hari — Screens 1, 2, 3 + Shared Components

> **Priority: Build shared components first** — Devipriya and Abinivas depend on them.

| Screen | Description | Route |
|---|---|---|
| **Shared Components** | AppLayout, Sidebar, StatusBadge, KPICard, DataTable, Modal, RoleGuard, NotificationBell | — |
| **Screen 1** — Login / Signup | Login form, create account (Employee only, no role picker), forgot password | `/login`, `/signup` |
| **Screen 2** — Dashboard | KPI cards, recent activity feed, quick action buttons | `/dashboard` |
| **Screen 3** — Organization Setup | 3 tabs: Departments, Asset Categories, Employee Directory | `/org` |

**Implementation notes:**
- **Shared first** — create `src/components/shared/` before touching any page. Devipriya & Abinivas will import from here.
- **Login/Signup:** No role picker on signup — always creates `Employee`. Supabase Auth for login/signup flows (`supabase.auth.signUp`, `supabase.auth.signInWithPassword`).
- **Dashboard KPIs:** Assets Available, Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns. Show overdue returns **separately** from upcoming.
- **Screen 3 — Org Setup (Admin-only, wrap with `<RoleGuard role="Admin">`):**
  - Tab A — Departments: CRUD, set department head, parent dept hierarchy, Active/Inactive toggle. Changes drive the dept picklist in Screens 4 & 5.
  - Tab B — Asset Categories: CRUD + custom fields (stored as JSON, e.g. `warranty_period_months`)
  - Tab C — Employee Directory: CRUD employees. **Only place role promotion happens** — role dropdown visible to Admin only. All other screens must NOT expose role-changing UI.

---

### 👩‍💻 Devipriya — Screens 4, 6, 9, 10

| Screen | Description | Route |
|---|---|---|
| **Screen 4** — Asset Registration & Directory | Register asset, asset table with search/filter/sort, per-asset detail drawer | `/assets` |
| **Screen 6** — Resource Booking | Calendar view, book a slot, overlap validation feedback, cancel/reschedule | `/bookings` |
| **Screen 9** — Reports & Analytics | Charts: utilization trends, maintenance freq, dept summary, booking heatmap | `/reports` |
| **Screen 10** — Activity Logs & Notifications | Notification feed (read/unread), full activity audit trail table | `/logs` |

**Implementation notes:**
- **Screen 4 — Asset Directory:**
  - Asset tag (`AF-0001`) is **display only** — auto-generated server-side, never let user type it
  - Search/filter by: tag, serial number, category, status, department, location
  - Per-asset detail must show two tabs: **Allocation History** + **Maintenance History**
  - Register asset form: name, category, serial number, QR code, acquisition date, cost (reporting only), condition, location, photo, is_bookable toggle
- **Screen 6 — Resource Booking:**
  - Only assets with `is_bookable = true` appear in the resource picker
  - Calendar view — show existing bookings per resource, color-coded by status (Upcoming=blue, Ongoing=green, Completed=grey, Cancelled=red)
  - Overlap error must be **descriptive**: *"This slot conflicts with a booking by [name] from [time] to [time]"*
  - Cancel/reschedule only allowed while `Upcoming`; reschedule re-triggers overlap validation
- **Screen 9 — Reports:** Read-only. No mutations. Charts: utilization (line), maintenance frequency (bar), booking heatmap (grid). Include CSV export button.
- **Screen 10 — Activity Logs:** Notification feed: grouped by type, mark as read individually or all. Activity log table: filter by actor, entity type, date range.

---

### 👨‍💻 Abinivas — Screens 5, 7, 8

| Screen | Description | Route |
|---|---|---|
| **Screen 5** — Asset Allocation & Transfer | Allocate asset, conflict blocking, transfer request flow, return + condition notes, overdue flags | `/allocations` |
| **Screen 7** — Maintenance Management | Raise request, Kanban approval board, assign technician, resolve | `/maintenance` |
| **Screen 8** — Asset Audit | Create audit cycle, assign auditors, per-asset verify, discrepancy report, close cycle | `/audit` |

**Implementation notes:**
- **Screen 5 — Allocation & Transfer:**
  - If asset already allocated → **show who holds it** → offer "Transfer Request" button. Do NOT show a generic error.
  - Transfer flow UI: Requested → (Asset Manager / Dept Head approves) → Re-allocated
  - Return flow: condition notes input required, Asset Manager must approve check-in
  - Overdue allocations (expected return date passed): highlight in red, shown at top of list
  - Allocation history list per asset at bottom of detail view
- **Screen 7 — Maintenance:**
  - Kanban board columns: **Pending → Approved → Technician Assigned → In Progress → Resolved**
  - Rejected requests shown in a separate "Rejected" tab, not in the main board
  - ⚠️ Asset Manager approval is what moves card Pending → Approved. Raising a request = Pending only.
  - Each card: asset name, issue description, priority badge (Low/Medium/High/Critical), raised by, raised at
- **Screen 8 — Audit:**
  - Create Audit Cycle: pick scope (dept and/or location) + date range
  - Assign auditors from employee list
  - Per-asset checklist: mark each `Verified | Missing | Damaged` with optional notes
  - Auto-generated discrepancy report = all Missing/Damaged items in cycle (derive, don't hard-code)
  - **Close Audit Cycle** button: locked state (no further edits), triggers asset status updates for Missing → Lost. Show confirmation dialog before close — this is irreversible.

---

## Shared Components (Hari builds — everyone imports)

> Path: `frontend/src/components/shared/`
> **Do NOT rebuild these** — import from shared. If something's missing, ask Hari to add it.

| Component | File | Description |
|---|---|---|
| `<AppLayout>` | `AppLayout.jsx` | Sidebar + top header wrapper — wraps every page |
| `<Sidebar>` | `Sidebar.jsx` | Left nav, role-aware (hide links user can't access) |
| `<StatusBadge>` | `StatusBadge.jsx` | Asset status chip with color coding |
| `<KPICard>` | `KPICard.jsx` | Dashboard stat card: icon + number + label |
| `<DataTable>` | `DataTable.jsx` | Sortable, filterable table — takes columns + data props |
| `<Modal>` | `Modal.jsx` | Generic modal wrapper with close button |
| `<ConfirmDialog>` | `ConfirmDialog.jsx` | "Are you sure?" dialog for destructive actions |
| `<NotificationBell>` | `NotificationBell.jsx` | Top-right bell with unread count badge |
| `<RoleGuard>` | `RoleGuard.jsx` | Hides/redirects content based on user role |

---

## Folder Structure (follow exactly)

```
frontend/src/
  components/
    shared/                    ← Hari builds, everyone imports
      AppLayout.jsx
      Sidebar.jsx
      StatusBadge.jsx
      KPICard.jsx
      DataTable.jsx
      Modal.jsx
      ConfirmDialog.jsx
      NotificationBell.jsx
      RoleGuard.jsx
  pages/
    auth/
      LoginPage.jsx            ← Hari
      SignupPage.jsx           ← Hari
    dashboard/
      DashboardPage.jsx        ← Hari
    org/
      OrgSetupPage.jsx         ← Hari
    assets/
      AssetDirectoryPage.jsx   ← Devipriya
      AssetDetailPage.jsx      ← Devipriya
    bookings/
      BookingPage.jsx          ← Devipriya
    reports/
      ReportsPage.jsx          ← Devipriya
    logs/
      ActivityLogsPage.jsx     ← Devipriya
    allocations/
      AllocationPage.jsx       ← Abinivas
    maintenance/
      MaintenancePage.jsx      ← Abinivas
    audit/
      AuditPage.jsx            ← Abinivas
  hooks/             ← shared hooks: useAuth, useNotifications (Hari sets up)
  services/          ← API call functions per resource (each person adds their own)
  context/           ← AuthContext (Hari), NotificationContext (Hari)
  App.jsx            ← Router setup — Hari sets up base, everyone registers their routes
```

---

## Before You Start — Checklist

- [ ] `git pull origin dev2` — get latest code
- [ ] Create your `.env` file (ask Hari for Supabase project URL and keys)
- [ ] `cd frontend && npm install` — install Tailwind + Supabase deps
- [ ] Read `docs/CHANGELOG.md` — see what's already done
- [ ] Read your screens in `docs/PRODUCT_CONTEXT.md`
- [ ] Import shared components from `src/components/shared/` — do NOT rebuild them
- [ ] Use **Tailwind CSS v4** for all styling — no inline styles, no plain CSS files
- [ ] After finishing: append your entry to `docs/CHANGELOG.md` with your name

---

## Tech Reminders for Frontend

| Thing | How |
|---|---|
| Supabase client | `import { supabase } from '../lib/supabase'` |
| Auth check | `supabase.auth.getUser()` — do NOT trust role from request body |
| Styling | Tailwind CSS v4 classes only |
| Components | Import shared from `src/components/shared/` |
| API calls | PUT them in `src/services/<module>.js` — not inline in components |
| Routing | React Router — add your routes to `App.jsx` |
