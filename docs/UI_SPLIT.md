# AssetFlow — UI Split Plan

> **Last updated:** 2026-07-12 by Hari
> This document defines who builds which screens for the frontend UI.
> Each person works in `/frontend/src/` under their own folder structure.
> **Reference wireframe:** `docs/AssetFlow - Enterprise Asset & Resource Management System - 8 hours.excalidraw`

---

## Team Members & Codenames

| Codename | Real Name | Area |
|---|---|---|
| **Hari** | Hari | Login · Dashboard · Asset Registration · Audit · Activity Logs |
| **Calm Mongoose** | TBD | Resource Booking · Maintenance Management |
| **Green Clam** | TBD | Asset Allocation & Transfer · Org Setup (shared) |
| **dhfee'aosh** | TBD | Reports & Analytics · Notifications |
| **penguin** | TBD | Organization Setup (Departments, Categories, Employee Directory) |

> Update "Real Name" once known. Codenames are from the Excalidraw wireframe.

---

## Screen Split (from wireframe)

### 👤 Hari
| Screen | Description | Route |
|---|---|---|
| **Screen 1** — Login / Signup | Login form, create account (Employee only), forgot password | `/login`, `/signup` |
| **Screen 2** — Dashboard | KPI cards, recent activity, quick action buttons | `/dashboard` |
| **Screen 4** — Asset Registration & Directory | Register asset, asset table with search/filter, per-asset detail | `/assets` |

**Notes for Hari:**
- Login: No role picker on signup — always creates `Employee`
- Dashboard KPIs: Assets Available, Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns
- Dashboard shows overdue returns separately from upcoming
- Asset tag auto-generated server-side: `AF-0001` format — display only, never let user type it
- Asset detail must show allocation history + maintenance history tabs

---

### 🐧 penguin
| Screen | Description | Route |
|---|---|---|
| **Screen 3** — Organization Setup | 3 tabs: Departments, Asset Categories, Employee Directory | `/org` |

**Notes for penguin:**
- Admin-only screen — wrap with role guard (hide/redirect if not Admin)
- **Tab A — Departments:** CRUD, set department head (from employee list), parent department (hierarchical), Active/Inactive toggle. Editing a department drives the department picklist on Screen 4 & 5.
- **Tab B — Asset Categories:** CRUD + custom fields (stored as JSON — e.g. `warranty_period_months`)
- **Tab C — Employee Directory:** CRUD employees + the **only** place role promotion happens. Role dropdown here — all other screens must NOT let users change roles.
- Role promotion: only Admin can see this dropdown. Roles: Employee, Department Head, Asset Manager, Admin.

---

### 🦞 Green Clam
| Screen | Description | Route |
|---|---|---|
| **Screen 5** — Asset Allocation & Transfer | Allocate asset, conflict blocking UI, transfer request flow, return with condition notes, overdue flag | `/allocations` |

**Notes for Green Clam:**
- If asset is already allocated → show who holds it → offer "Transfer Request" button (not generic error)
- Transfer flow: Requested → (Asset Manager / Dept Head approves) → Re-allocated
- Return flow: condition notes required, Asset Manager approves check-in
- Overdue allocations highlighted (expected return date passed) — shown prominently
- Allocation history list at the bottom of each asset's detail

---

### 🦦 Calm Mongoose
| Screen | Description | Route |
|---|---|---|
| **Screen 6** — Resource Booking | Calendar view, book a slot, overlap validation feedback, cancel/reschedule | `/bookings` |
| **Screen 7** — Maintenance Management | Raise request, approval workflow board (Kanban-style columns), assign technician, resolve | `/maintenance` |

**Notes for Calm Mongoose:**
- Booking: only `is_bookable = true` assets appear in the picker
- Calendar view must show existing bookings per resource (color-coded by status)
- Overlap error must be descriptive: "This slot conflicts with booking by [name] from [time] to [time]"
- Maintenance board columns: Pending → Approved → Technician Assigned → In Progress → Resolved
- Rejected requests shown separately (not in main flow)
- Asset Manager approval is what moves card from Pending → Approved (not just raising)

---

### 🐟 dhfee'aosh
| Screen | Description | Route |
|---|---|---|
| **Screen 9** — Reports & Analytics | Charts: utilization trends, maintenance frequency, dept allocation summary, booking heatmap | `/reports` |
| **Screen 10** — Activity Logs & Notifications | Notification feed (read/unread), full activity audit trail table | `/logs` |

**Notes for dhfee'aosh:**
- Reports are read-only — no mutations on this screen
- Charts: utilization trend (line), maintenance frequency (bar), booking heatmap (grid/calendar)
- Export button — at minimum CSV export for tables
- Notifications: grouped by type, mark as read individually or all-at-once
- Activity log: filter by actor, entity type, date range

---

## Screen 8 — Asset Audit (🔴 Unassigned — needs owner)
| Screen | Description | Route |
|---|---|---|
| **Screen 8** — Asset Audit | Create cycle, assign auditors, verify per asset, discrepancy report, close cycle | `/audit` |

> **⚠️ ACTION NEEDED:** Assign this screen to a team member. Update this file + `MODULE_OWNERS.md`.

---

## Shared Components (everyone uses — build once, use everywhere)

> **Who builds shared components:** Hari starts these since Screen 1 & 2 need them first.
> Others should **not duplicate** — import from `src/components/shared/`.

| Component | Description |
|---|---|
| `<AppLayout>` | Sidebar nav + top header wrapper |
| `<Sidebar>` | Left nav with all screen links, role-aware (hide screens user can't access) |
| `<StatusBadge>` | Asset status chip: Available (green), Allocated (blue), Under Maintenance (orange), etc. |
| `<KPICard>` | Dashboard stat card with icon + number + label |
| `<DataTable>` | Reusable sortable/filterable table |
| `<Modal>` | Generic modal wrapper |
| `<ConfirmDialog>` | "Are you sure?" dialog for destructive actions |
| `<NotificationBell>` | Top-right bell icon with unread count badge |
| `<RoleGuard>` | Wrapper that hides/redirects based on role |

---

## Folder Structure (follow this exactly)

```
frontend/src/
  components/
    shared/          ← shared components (everyone imports from here)
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
      LoginPage.jsx          ← Hari
      SignupPage.jsx         ← Hari
    dashboard/
      DashboardPage.jsx      ← Hari
    org/
      OrgSetupPage.jsx       ← penguin
    assets/
      AssetDirectoryPage.jsx ← Hari
      AssetDetailPage.jsx    ← Hari
    allocations/
      AllocationPage.jsx     ← Green Clam
    bookings/
      BookingPage.jsx        ← Calm Mongoose
    maintenance/
      MaintenancePage.jsx    ← Calm Mongoose
    audit/
      AuditPage.jsx          ← 🔴 UNASSIGNED
    reports/
      ReportsPage.jsx        ← dhfee'aosh
    logs/
      ActivityLogsPage.jsx   ← dhfee'aosh
  hooks/             ← shared custom hooks (useAuth, useNotifications, etc.)
  services/          ← API call functions (fetch wrappers per resource)
  context/           ← AuthContext, NotificationContext
  App.jsx            ← Router setup (Hari sets up routes, others add their own)
```

---

## Before You Start Coding — Checklist

- [ ] Read `docs/CHANGELOG.md` to see what's already done
- [ ] Check `docs/MODULE_OWNERS.md` for your screen status
- [ ] Read the relevant sections of `docs/PRODUCT_CONTEXT.md` (§3, §5–10 depending on your screen)
- [ ] Don't implement business rule enforcement only in the UI — the API enforces it too
- [ ] After finishing: append to `docs/CHANGELOG.md` with your name + what you built

---

## Design Decisions (team must align before Day 1 coding)

| Decision | Options | Default suggestion |
|---|---|---|
| Component library | shadcn/ui vs MUI | **shadcn/ui** (lighter, more flexible) |
| Design theme | Light vs Dark vs Both | **Dark default** with light toggle |
| Auth storage | localStorage vs httpOnly cookie | **httpOnly cookie** (more secure) |
| Overdue detection | Scheduled job vs query-time | **Query-time** for hackathon speed |
| Booking `Reserved` semantics | Booking-scoped vs general flag | **Booking-scoped** (flip back on cancel) |

> First person to implement each: update `docs/PRODUCT_CONTEXT.md` with the decision.
