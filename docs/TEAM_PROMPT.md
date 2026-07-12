# AssetFlow — Team Onboarding Prompt for AI Agents

> **How to use this file:**
> Copy everything between the `---START PROMPT---` and `---END PROMPT---` markers below and paste it as the **first message** into your AI assistant (Claude, Cursor, Copilot, Gemini, etc.) at the start of every session. This gives your AI full project context instantly so it doesn't guess business rules or make conflicting decisions.

---

---START PROMPT---

## You are working on AssetFlow — a team hackathon project.

Read this entire prompt carefully before writing any code or giving any advice.

---

### What AssetFlow is

AssetFlow is an **Enterprise Asset & Resource Management system** — a hackathon build.
It is **not** a full ERP. It tracks physical assets (equipment, vehicles, furniture, shared spaces), allocates them to people/departments, handles booking of shared resources, routes maintenance through approvals, and runs audit cycles.

**Out of scope — do not build:** purchasing, invoicing, accounting, payment processing. Acquisition cost is stored only for reporting.

---

### Tech Stack (locked — do not change)

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite (already scaffolded) |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL via **Supabase** (hosted) |
| ORM | **Prisma** (use exclusively — no raw SQL) |
| Auth | **Supabase Auth** — JWT issued by Supabase, verified server-side |
| Styling | **Tailwind CSS v4** (via `@tailwindcss/vite`) — use Tailwind classes, no inline styles |
| Component Library | **Decision pending** — shadcn/ui or MUI (team must agree before anyone starts) |
| Language | JavaScript (ES Modules, `"type": "module"` in both packages) |
| Repo structure | Monorepo: `/frontend` (Vite React) + `/backend` (Express + Prisma) |

> **⚠️ ENV SETUP REQUIRED:** Each teammate must create their own `.env` files — they are not committed.
> - `frontend/.env` → `VITE_SUPABASE_URL=...` and `VITE_SUPABASE_ANON_KEY=...`
> - `backend/.env` → `SUPABASE_URL=...` and `SUPABASE_SERVICE_ROLE_KEY=...`
> Get these values from the team's Supabase project dashboard. Ask Hari for the project URL.

---

### Current State of the Codebase (as of 2026-07-12)

- **Frontend:** Default Vite React template only. `src/App.jsx` is the default counter demo — needs to be completely replaced.
- **Backend:** `src/server.js` has only a `/health` endpoint. Nothing else built yet.
- **Database:** `backend/prisma/schema.prisma` is **empty** — no models defined yet. This is the first critical thing to build.
- **Docs folder:** `docs/CHANGELOG.md` tracks all changes. `docs/MODULE_OWNERS.md` tracks who owns what.

---

### Repo Layout

```
/frontend          React app (Vite + React 19)
  src/App.jsx      — default template, replace entirely
  src/index.css    — global styles
/backend
  src/server.js    — Express entry point, only /health exists
  prisma/
    schema.prisma  — EMPTY — needs all models
/docs
  PRODUCT_CONTEXT.md  — full product spec (source of truth)
  CHANGELOG.md        — append-only team log (read before starting, append when done)
  MODULE_OWNERS.md    — who owns each module
  TEAM_PROMPT.md      — this file
AGENTS.md             — coding agent conventions
```

---

### Business Rules (Non-Negotiable — enforce server-side always)

1. **No self-role-assignment.** Signup always creates `Employee`. Only Admin can promote via Employee Directory. Never add a "become admin" button.
2. **No double-allocation.** One asset = one active allocation at a time. Enforce with DB transaction + row lock (`SELECT ... FOR UPDATE`), not just an app-level check.
3. **Booking overlap check runs server-side.** Reject if `new.start < existing.end AND new.end > existing.start` (back-to-back is allowed).
4. **Maintenance approval — not raise — flips asset to `Under Maintenance`.**
5. **Closing an audit cycle is atomic** — lock the cycle AND update asset statuses in one DB transaction.
6. **Every state transition is validated server-side** against current state. Reject invalid transitions with a clear error.

---

### Asset Status State Machine

Valid transitions only (reject everything else):

```
Available → Allocated          (on allocation)
Allocated → Available          (on return)
Available → Reserved           (bookable asset gets active booking)
Reserved  → Available          (booking completes/cancels)
Available ↔ Under Maintenance  (maintenance approved → Under Maintenance; resolved → Available)
Allocated → Under Maintenance  (allocated asset needs repair)
Under Maintenance → Allocated  (resolved while held — return to Allocated, not Available)
Any active state → Lost        (confirmed missing when audit cycle closes)
Any → Retired                  (Admin/Asset Manager action)
Retired → Disposed             (terminal — no transitions out)
```

---

### User Roles & What They Can Do

| Role | Permissions |
|---|---|
| **Admin** | Everything. Manage departments, categories, audit cycles. Assign roles. |
| **Asset Manager** | Register & allocate assets. Approve transfers, maintenance, audit resolution, returns. |
| **Department Head** | View dept assets. Approve allocation/transfer within dept only. Book resources for dept. |
| **Employee** | View own assets. Book resources. Raise maintenance requests. Request return/transfer. |

---

### The 10 Screens to Build

| # | Screen | Key rules |
|---|---|---|
| 1 | Login / Signup | Signup = Employee only. No role picker. |
| 2 | Dashboard | KPI cards, overdue returns, quick actions. |
| 3 | Organization Setup (Admin) | Dept CRUD, Category CRUD, Employee Directory + role promotion. |
| 4 | Asset Registration & Directory | Auto asset tag (AF-0001), search/filter, per-asset history. |
| 5 | Asset Allocation & Transfer | Conflict blocking, transfer flow, return with condition notes, overdue flags. |
| 6 | Resource Booking | Calendar view, overlap validation, cancel/reschedule. |
| 7 | Maintenance Management | Full approval workflow, auto asset status sync. |
| 8 | Asset Audit | Create cycle, assign auditors, verify per asset, close cycle atomically. |
| 9 | Reports & Analytics | Utilization, booking heatmap, exportable. |
| 10 | Activity Logs & Notifications | Notification feed, full audit trail. |

---

### API Conventions

- **Base path:** `/api/v1/...`
- **HTTP status codes:** 409 for conflict (double-allocation, booking overlap), 422 for validation, not generic 400.
- **Auth:** JWT in `Authorization: Bearer <token>`. Role embedded in token, re-checked server-side on every protected route. Never trust role from request body.
- **Naming:** `snake_case` in DB, `camelCase` in JS. Asset tags: `AF-0001` (server-generated).

---

### Notifications to Generate

Trigger a notification + activity log on:
- Asset Assigned
- Maintenance Approved / Rejected
- Booking Confirmed / Cancelled
- Booking Reminder (30 min before slot)
- Transfer Approved
- Overdue Return Alert
- Audit Discrepancy Flagged

---

### Your Responsibilities Before Writing Any Code

1. **Read `docs/CHANGELOG.md`** — understand what your teammates have already built.
2. **Read `docs/MODULE_OWNERS.md`** — check who owns the module you're touching.
3. **Read the relevant section of `PRODUCT_CONTEXT.md`** for any feature touching assets, bookings, maintenance, or audits.
4. **Do not overwrite** what another teammate has built without coordinating.
5. **After finishing**, append an entry to `docs/CHANGELOG.md` with your name, what you changed, and why.

---

### UI Screen Split (who builds what)

> Full details + folder structure: `docs/UI_SPLIT.md`

| Owner | Screens |
|---|---|
| **Hari** | Screen 1 (Login/Signup) · Screen 2 (Dashboard) · Screen 4 (Asset Directory) · All shared components |
| **penguin** | Screen 3 (Org Setup — Departments, Categories, Employee Dir + role promotion) |
| **Green Clam** | Screen 5 (Asset Allocation & Transfer) |
| **Calm Mongoose** | Screen 6 (Resource Booking) · Screen 7 (Maintenance Management) |
| **dhfee'aosh** | Screen 9 (Reports & Analytics) · Screen 10 (Activity Logs & Notifications) |
| **⚠️ UNASSIGNED** | Screen 8 (Asset Audit) — needs an owner |

**Folder structure:** `frontend/src/components/shared/` for shared components, `frontend/src/pages/<module>/` for pages.

**Shared components** (Hari builds, everyone imports from `src/components/shared/`):
`AppLayout`, `Sidebar`, `StatusBadge`, `KPICard`, `DataTable`, `Modal`, `ConfirmDialog`, `NotificationBell`, `RoleGuard`

---

### After You Finish Work — Append This to docs/CHANGELOG.md

```
### [YYYY-MM-DD HH:MM] — <Your Name> — <Module/Area>
**Type:** Feature | Fix | Refactor | Schema | Config | Docs
**Files Changed:**
- list every file touched

**Summary:**
Short paragraph of what was done and why.

**Details:**
- Bullet point of change 1
- Bullet point of change 2

**Open / Decisions Made:**
- Any decision resolved or still pending
```

---END PROMPT---

---

> **Important:** After pasting this prompt, also share the contents of `docs/CHANGELOG.md` with your AI so it knows the latest state of changes from all teammates.
