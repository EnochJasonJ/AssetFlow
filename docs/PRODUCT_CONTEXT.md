# AssetFlow — Product Context

> Source of truth for product behavior. AGENTS.md and CLAUDE.md are operating
> instructions for coding agents; this file is the spec they must build against.
> If code and this file disagree, this file wins — update it deliberately via PR,
> don't silently drift.

## 1. Vision

AssetFlow is an industry-agnostic Enterprise Asset & Resource Management
system (ERP module, not a full ERP). Any organization with physical assets,
equipment, vehicles, furniture, or shared spaces can use it to track asset
lifecycles, allocate assets to people/departments, book shared resources
without conflicts, route maintenance through approvals, and run audit cycles.

**Explicitly out of scope:** purchasing, invoicing, accounting. Acquisition
cost is stored only for reporting/ranking, never linked to financial ledgers.

## 2. Tech Stack (confirmed)

- **Frontend:** React (Vite), React Router, a component library (pick one —
  suggest shadcn/ui or MUI — and stay consistent across the whole app)
- **Backend:** Node.js + Express, REST API
- **Database:** PostgreSQL (relational — lean into it: foreign keys, enums,
  check constraints, transactions for anything touching asset state)
- **Repo:** Monorepo — `/frontend` and `/backend` as workspaces
- **Auth:** JWT (access + refresh) or session-based — pick one early and
  document it in AGENTS.md; do not mix patterns across endpoints
- **ORM/query layer:** pick one (Prisma or Knex are good fits for Postgres)
  and use it consistently — no raw SQL scattered next to ORM calls

## 3. User Roles & Permissions

Roles are **never self-assigned**. Signup always creates an `Employee`.
Only Admin can promote an Employee to Department Head or Asset Manager, and
only from the Employee Directory (Screen 3, Tab C).

| Role | Can do |
|---|---|
| **Admin** | Manage departments, asset categories, audit cycles, employee/role assignment (Organization Setup). View org-wide analytics. Implicitly has all lower-role permissions. |
| **Asset Manager** | Register & allocate assets. Approve transfers, maintenance requests, audit discrepancy resolution. Approve returns and condition check-in notes. |
| **Department Head** | View assets allocated to their department. Approve allocation/transfer requests *within their department only*. Book shared resources on behalf of the department. |
| **Employee** | View assets allocated to them. Book shared resources. Raise maintenance requests. Initiate return/transfer requests. |

Enforce role checks server-side on every mutating endpoint — never trust a
role claim from the client beyond the JWT/session it presents.

## 4. Core Entities & Suggested Schema

Design with foreign keys and enums; use DB transactions for any operation
that changes asset state (allocation, return, maintenance approval, audit
close) so partial updates can't leave an asset in an inconsistent state.

```
departments
  id, name, head_employee_id (FK -> employees, nullable),
  parent_department_id (FK -> departments, nullable, self-referencing),
  status (Active | Inactive), created_at, updated_at

asset_categories
  id, name, custom_fields (jsonb, e.g. {"warranty_period_months": 24}),
  created_at

employees
  id, name, email (unique), password_hash, department_id (FK),
  role (Employee | DepartmentHead | AssetManager | Admin),
  status (Active | Inactive), created_at, updated_at

assets
  id, asset_tag (unique, auto-generated e.g. AF-0001), name,
  category_id (FK), serial_number, qr_code,
  acquisition_date, acquisition_cost (numeric, reporting-only),
  condition, location, photo_url, is_bookable (bool),
  status (Available | Allocated | Reserved | UnderMaintenance | Lost | Retired | Disposed),
  created_at, updated_at

allocations
  id, asset_id (FK), employee_id (FK, nullable), department_id (FK, nullable),
  allocated_at, expected_return_date (nullable), actual_return_date (nullable),
  return_condition_notes, status (Active | Returned | Overdue),
  created_by (FK employees)

transfer_requests
  id, asset_id (FK), from_employee_id (FK), to_employee_id (FK),
  status (Requested | Approved | Rejected), requested_by (FK),
  approved_by (FK, nullable), requested_at, resolved_at

bookings
  id, resource_asset_id (FK, must reference an is_bookable asset),
  booked_by (FK employees), department_id (FK, nullable — for "on behalf of"),
  start_time, end_time, status (Upcoming | Ongoing | Completed | Cancelled),
  created_at
  -- DB-level exclusion constraint recommended (btree_gist + EXCLUDE) to
  -- enforce no-overlap per resource_asset_id, in addition to app-level checks

maintenance_requests
  id, asset_id (FK), raised_by (FK employees), issue_description,
  priority (Low | Medium | High | Critical), photo_url,
  status (Pending | Approved | Rejected | TechnicianAssigned | InProgress | Resolved),
  approved_by (FK, nullable), technician_name, raised_at, resolved_at

audit_cycles
  id, scope_department_id (FK, nullable), scope_location (nullable),
  start_date, end_date, status (Open | Closed), created_by (FK), closed_at

audit_cycle_auditors
  audit_cycle_id (FK), employee_id (FK)  -- composite PK, many-to-many

audit_items
  id, audit_cycle_id (FK), asset_id (FK), auditor_id (FK),
  result (Verified | Missing | Damaged | Pending), notes, checked_at

notifications
  id, employee_id (FK), type, message, related_entity_type, related_entity_id,
  read_at (nullable), created_at

activity_logs
  id, actor_id (FK employees), action, entity_type, entity_id,
  metadata (jsonb), created_at
```

## 5. Asset Lifecycle (state machine)

States: `Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed`

Valid transitions to implement and enforce **server-side** (reject anything
not in this list, don't rely on the UI to prevent it):

- `Available → Allocated` — on successful allocation
- `Allocated → Available` — on return
- `Available → Reserved` — when a bookable resource has an active booking
  (or treat Reserved as booking-scoped; decide and document the exact
  semantics in code comments, since the spec allows either interpretation)
- `Reserved → Available` — booking completes/cancels
- `Available ↔ Under Maintenance` — approved maintenance request flips to
  Under Maintenance; Resolved flips back to Available (see §7)
- `Allocated → Under Maintenance` — allocated assets can also need repair;
  return to `Allocated` (not `Available`) on resolution if still held
- `Any active state → Lost` — via audit cycle close, for confirmed-missing items
- `Any → Retired` — Admin/Asset Manager action
- `Retired → Disposed` — terminal state, no further transitions out

## 6. Allocation & Transfer Rules

- An asset can have **at most one active allocation** at a time. Enforce
  with a partial unique index or an application-level check inside a
  transaction (`SELECT ... FOR UPDATE` the asset row before allocating).
- Attempting to allocate an already-allocated asset must **block the
  action**, tell the requester who currently holds it, and offer a
  **Transfer Request** instead — don't just return a generic error.
- Transfer workflow: `Requested → Approved (by Asset Manager or the
  relevant Department Head) → Re-allocated`. On approval, close out the old
  allocation record and create a new one atomically; update asset history.
- Return flow: mark returned, capture condition check-in notes (per Asset
  Manager approval), asset status reverts to `Available` (or stays
  `Under Maintenance` if the return reveals damage — flag for a
  maintenance request instead of silently going Available).
- Overdue allocations (`expected_return_date` passed, not yet returned) are
  auto-flagged — surfaced on Dashboard KPIs and Notifications. Compute this
  via a scheduled job or a query-time check; document which approach you pick.

## 7. Resource Booking Rules

- Only assets with `is_bookable = true` are bookable.
- **Overlap validation** per resource: reject a new booking if
  `new.start_time < existing.end_time AND new.end_time > existing.start_time`
  for any existing non-cancelled booking on the same asset. A booking that
  starts exactly when another ends is **not** an overlap (back-to-back is fine).
- Booking status lifecycle: `Upcoming → Ongoing → Completed` (time-driven,
  computed or via scheduled job) and `Upcoming/Ongoing → Cancelled` (user action).
- Cancel/reschedule allowed while `Upcoming`; reschedule re-runs overlap validation.
- Send a reminder notification before the slot starts (pick a fixed lead
  time, e.g. 30 min, and document it).

## 8. Maintenance Workflow

`Pending → Approved | Rejected (Asset Manager) → Technician Assigned →
In Progress → Resolved`

- Asset status auto-updates to `Under Maintenance` **on Approved**, not on
  raising the request — work hasn't started yet at Pending.
- Asset status reverts to `Available` (or `Allocated`, see §5) **on Resolved**.
- Rejected requests do not change asset status.
- Full maintenance history is retained per asset (don't hard-delete; keep
  every request record, filterable by asset)

## 9. Audit Cycle Workflow

1. Admin/Asset Manager creates an Audit Cycle: scope (department and/or
   location) + date range.
2. One or more auditors assigned to the cycle.
3. Each in-scope asset gets an `audit_item` row (default `Pending`); auditor
   marks each `Verified | Missing | Damaged` with optional notes.
4. System auto-generates a discrepancy report = all `Missing`/`Damaged`
   items in the cycle (derive this, don't hand-maintain a separate table).
5. **Close Audit Cycle**: locks the cycle (no further edits to its items),
   and updates affected asset statuses — confirmed-`Missing` items transition
   the asset to `Lost`. Do this in a single transaction.
6. Audit history retained per cycle, browsable later.

## 10. Notifications (trigger list)

Generate a notification (and an activity log entry) on: Asset Assigned,
Maintenance Approved/Rejected, Booking Confirmed/Cancelled, Booking
Reminder, Transfer Approved, Overdue Return Alert, Audit Discrepancy
Flagged. Keep the notification `type` field an enum so the frontend can
route/icon them consistently.

## 11. Screens (10 total) — functional summary

1. **Login/Signup** — signup = Employee only, no role picker. Login,
   forgot password, session validation.
2. **Dashboard** — KPI cards (Assets Available, Allocated, Maintenance
   Today, Active Bookings, Pending Transfers, Upcoming Returns); overdue
   returns shown separately from upcoming; quick actions (Register Asset,
   Book Resource, Raise Maintenance Request).
3. **Organization Setup** (Admin only, 3 tabs) — Departments (CRUD,
   head, parent hierarchy, status); Asset Categories (CRUD, custom fields);
   Employee Directory (CRUD, and the *only* place role promotion happens).
4. **Asset Registration & Directory** — register with auto asset tag,
   search/filter (tag, serial, QR, category, status, department, location),
   lifecycle status, per-asset allocation + maintenance history.
5. **Asset Allocation & Transfer** — allocate with conflict blocking,
   transfer request flow, return flow with condition notes, overdue flags.
6. **Resource Booking** — calendar view, overlap validation, status
   lifecycle, cancel/reschedule, reminders.
7. **Maintenance Management** — raise/approve/assign/resolve workflow,
   auto asset status sync, retained history.
8. **Asset Audit** — create cycle, assign auditors, per-asset verification,
   auto discrepancy report, close cycle (locks + status updates).
9. **Reports & Analytics** — utilization trends, maintenance frequency,
   assets due for maintenance/retirement, department allocation summary,
   booking heatmap, exportable reports.
10. **Activity Logs & Notifications** — notification feed, full audit
    trail of who-did-what-when.

## 12. Non-negotiable business rules (checklist for review/PRs)

- [ ] No endpoint lets a user set their own role. Role changes only via
      Admin → Employee Directory.
- [ ] Double-allocation of the same asset is impossible even under
      concurrent requests (use a transaction + row lock or a DB constraint,
      not just an app-level `if` check).
- [ ] Booking overlap check runs server-side, not just in the UI.
- [ ] Maintenance approval — not the raise action — is what flips the asset
      to Under Maintenance.
- [ ] Closing an audit cycle is atomic: locking the cycle and updating
      asset statuses happen in one transaction.
- [ ] Every state transition listed in §5 is validated server-side against
      the current state — no arbitrary status writes.
