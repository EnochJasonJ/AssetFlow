# AssetFlow — Module Ownership

> Who is responsible for each part of the project. AI agents: check this before touching a module — coordinate with the owner if you're making changes outside your assigned area.
> **UI split details & folder structure:** see `docs/UI_SPLIT.md`

---

## Team

| Name | Role |
|---|---|
| **Hari** | Frontend — Screen 1, 2, 3 + All Shared Components |
| **Devipriya** | Frontend — Screen 4, 6, 9, 10 |
| **Abinivas** | Frontend — Screen 5, 7, 8 |
| **Jason** | Backend — all of `/backend` (API, DB, Auth, Prisma schema, migrations) |

---

## Frontend Modules

| Screen | Owner | Status | Route | Notes |
|---|---|---|---|---|
| **Shared Components** | Hari | 🔴 Not started | — | AppLayout, Sidebar, StatusBadge, KPICard, DataTable, Modal, RoleGuard, NotificationBell, ConfirmDialog |
| **Screen 1** — Login / Signup | Hari | 🔴 Not started | `/login`, `/signup` | Supabase Auth, Employee-only signup, no role picker |
| **Screen 2** — Dashboard | Hari | 🔴 Not started | `/dashboard` | KPI cards, overdue returns, quick actions |
| **Screen 3** — Organization Setup | Hari | 🔴 Not started | `/org` | Admin-only: 3 tabs — Depts, Categories, Employee Dir + role promotion |
| **Screen 4** — Asset Registration & Directory | Devipriya | 🟢 Done / merged | `/assets` | Auto asset tag AF-0001 (display only), search/filter, per-asset history |
| **Screen 5** — Asset Allocation & Transfer | Abinivas | 🔴 Not started | `/allocations` | Conflict blocking, transfer flow, return + condition notes, overdue flags |
| **Screen 6** — Resource Booking | Devipriya | 🟢 Done / merged | `/bookings` | Calendar view, overlap validation, cancel/reschedule |
| **Screen 7** — Maintenance Management | Abinivas | 🔴 Not started | `/maintenance` | Kanban approval board, asset status sync |
| **Screen 8** — Asset Audit | Abinivas | 🔴 Not started | `/audit` | Create cycle, assign auditors, per-asset verify, atomic close |
| **Screen 9** — Reports & Analytics | Devipriya | 🟢 Done / merged | `/reports` | Charts, heatmap, CSV export |
| **Screen 10** — Activity Logs & Notifications | Devipriya | 🟢 Done / merged | `/logs` | Notification feed, full audit trail |
| **App Router setup** | Hari | 🔴 Not started | `App.jsx` | Hari sets up base routes, others register their routes |

---

## Backend Modules (Jason owns all of these)

| Module | Owner | Status | Notes |
|---|---|---|---|
| **Database Schema (Prisma)** | Jason | 🟡 In progress | `users` model done — needs assets, allocations, bookings, maintenance, audit, etc. |
| **Auth (Supabase Auth)** | Jason | 🔴 Not started | JWT via Supabase, verified server-side per request |
| **Asset CRUD API** | Jason | 🔴 Not started | `/api/v1/assets` |
| **Allocation & Transfer API** | Jason | 🔴 Not started | Complex state machine — read §5,§6 of PRODUCT_CONTEXT.md |
| **Resource Booking API** | Jason | 🔴 Not started | Overlap validation server-side — read §7 |
| **Maintenance API** | Jason | 🔴 Not started | Approval gate required — read §8 |
| **Audit Cycle API** | Jason | 🔴 Not started | Atomic close transaction — read §9 |
| **Notifications API** | Jason | 🔴 Not started | Trigger list in §10 |
| **Reports/Analytics API** | Jason | 🔴 Not started | Read-only aggregation queries |

---

## Status Legend
- 🔴 Not started
- 🟡 In progress
- 🟢 Done / merged
- ⚠️ Blocked (add a note why)

---

> **Update this table** whenever you start or finish a module. Change status + add your name.
> Always pair the status update here with an entry in `docs/CHANGELOG.md`.
