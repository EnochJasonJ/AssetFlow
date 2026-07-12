# AssetFlow — Module Ownership

> Who is responsible for each part of the project. AI agents: check this before touching a module — coordinate with the owner if you're making changes outside your assigned area.
> **UI split details & folder structure:** see `docs/UI_SPLIT.md`

---

## Backend Modules

| Module | Owner | Status | Notes |
|---|---|---|---|
| **Database Schema (Prisma)** | Hari | 🔴 Not started | Empty schema — needs full model definitions first |
| **Backend: Auth (JWT)** | TBD | 🔴 Not started | Decision pending — JWT confirmed direction |
| **Backend: Asset CRUD** | TBD | 🔴 Not started | — |
| **Backend: Allocation & Transfer** | TBD | 🔴 Not started | Complex state machine — read §5,§6 of PRODUCT_CONTEXT.md |
| **Backend: Resource Booking** | TBD | 🔴 Not started | Overlap validation required — read §7 |
| **Backend: Maintenance** | TBD | 🔴 Not started | Approval gate required — read §8 |
| **Backend: Audit Cycle** | TBD | 🔴 Not started | Atomic close transaction — read §9 |
| **Backend: Notifications** | TBD | 🔴 Not started | Trigger list in §10 |
| **Backend: Reports/Analytics** | TBD | 🔴 Not started | Read-only queries |

---

## Frontend Modules

| Screen | Owner | Status | Route | Notes |
|---|---|---|---|---|
| **Shared Components** | Hari | 🔴 Not started | — | AppLayout, Sidebar, StatusBadge, KPICard, DataTable, Modal, RoleGuard |
| **Screen 1** — Login / Signup | Hari | 🔴 Not started | `/login`, `/signup` | Employee-only signup, no role picker |
| **Screen 2** — Dashboard | Hari | 🔴 Not started | `/dashboard` | KPI cards, overdue returns, quick actions |
| **Screen 3** — Organization Setup | penguin | 🔴 Not started | `/org` | Admin-only: 3 tabs — Depts, Categories, Employee Dir + role promotion |
| **Screen 4** — Asset Registration & Directory | Hari | 🔴 Not started | `/assets` | Auto asset tag AF-0001, search/filter, per-asset history |
| **Screen 5** — Asset Allocation & Transfer | Green Clam | 🔴 Not started | `/allocations` | Conflict blocking, transfer flow, return + condition notes, overdue flags |
| **Screen 6** — Resource Booking | Calm Mongoose | 🔴 Not started | `/bookings` | Calendar view, overlap validation, cancel/reschedule |
| **Screen 7** — Maintenance Management | Calm Mongoose | 🔴 Not started | `/maintenance` | Full approval workflow, Kanban board, asset status sync |
| **Screen 8** — Asset Audit | ⚠️ UNASSIGNED | 🔴 Not started | `/audit` | Create cycle, assign auditors, per-asset verify, atomic close |
| **Screen 9** — Reports & Analytics | dhfee'aosh | 🔴 Not started | `/reports` | Charts, heatmap, export |
| **Screen 10** — Activity Logs & Notifications | dhfee'aosh | 🔴 Not started | `/logs` | Notification feed, full audit trail |
| **App Router setup** | Hari | 🔴 Not started | `App.jsx` | Hari sets up base routes, others register their own |

---

## Status Legend
- 🔴 Not started
- 🟡 In progress
- 🟢 Done / merged
- ⚠️ Blocked or unassigned (add a note why)

---

> **Update this table** whenever you start or finish a module. Add your name and change the status.
> Always pair the status update here with an entry in `docs/CHANGELOG.md`.
