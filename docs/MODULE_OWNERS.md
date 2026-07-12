# AssetFlow — Module Ownership

> Who is responsible for each part of the project. AI agents: check this before touching a module — coordinate with the owner if you're making changes outside your assigned area.

| Module | Owner | Status | Notes |
|---|---|---|---|
| **Database Schema (Prisma)** | Hari | 🔴 Not started | Empty schema — needs full model definitions |
| **Backend: Auth (JWT)** | TBD | 🔴 Not started | Decision needed: JWT vs session |
| **Backend: Asset CRUD** | TBD | 🔴 Not started | — |
| **Backend: Allocation & Transfer** | TBD | 🔴 Not started | Complex state machine — read §5,§6 of PRODUCT_CONTEXT.md |
| **Backend: Resource Booking** | TBD | 🔴 Not started | Overlap validation required — read §7 |
| **Backend: Maintenance** | TBD | 🔴 Not started | Approval gate required — read §8 |
| **Backend: Audit Cycle** | TBD | 🔴 Not started | Atomic close transaction — read §9 |
| **Backend: Notifications** | TBD | 🔴 Not started | Trigger list in §10 |
| **Backend: Reports/Analytics** | TBD | 🔴 Not started | Read-only queries |
| **Frontend: Design System / Layout** | TBD | 🔴 Not started | Pick component lib first |
| **Frontend: Login / Signup** | TBD | 🔴 Not started | Screen 1 |
| **Frontend: Dashboard** | TBD | 🔴 Not started | Screen 2 — KPI cards, quick actions |
| **Frontend: Org Setup** | TBD | 🔴 Not started | Screen 3 — Admin only |
| **Frontend: Asset Directory** | TBD | 🔴 Not started | Screen 4 |
| **Frontend: Allocation & Transfer** | TBD | 🔴 Not started | Screen 5 |
| **Frontend: Resource Booking** | TBD | 🔴 Not started | Screen 6 — calendar view |
| **Frontend: Maintenance** | TBD | 🔴 Not started | Screen 7 |
| **Frontend: Audit** | TBD | 🔴 Not started | Screen 8 |
| **Frontend: Reports** | TBD | 🔴 Not started | Screen 9 |
| **Frontend: Activity Logs** | TBD | 🔴 Not started | Screen 10 |

---

## Status Legend
- 🔴 Not started
- 🟡 In progress
- 🟢 Done / merged
- ⚠️ Blocked (add a note why)

---

> **Update this table** whenever you start or finish a module. Add your name and change the status. Do it alongside your `CHANGELOG.md` entry.
