# AssetFlow — Team Changelog

> **How this file works:**
> - **Never overwrite** entries. Always **append** new entries at the top (latest first).
> - Every entry must include: **Date · Time · Author name · What was changed and why**.
> - Use the format below precisely — AI agents read this file to understand what each teammate has done.
> - This file is shared across all team members and their AI assistants.

---

## Format Template (copy-paste for every entry)

```
### [YYYY-MM-DD HH:MM] — <Your Name> — <Module/Area>
**Type:** Feature | Fix | Refactor | Schema | Config | Docs
**Files Changed:** list every file touched
**Summary:**
Short paragraph of what was done and why.

**Details:**
- Bullet point of specific change 1
- Bullet point of specific change 2

**Open / Decisions Made:**
- Any decision that was open and is now resolved (update PRODUCT_CONTEXT.md too if relevant)
- Any thing left pending for next session
```

---

## Entries (Latest First)

### [2026-07-12 13:20] — Devipriya — Frontend Screens 4, 6, 9, 10
**Type:** Feature
**Files Changed:**
- `frontend/src/services/assets.js`
- `frontend/src/services/bookings.js`
- `frontend/src/services/reports.js`
- `frontend/src/services/logs.js`
- `frontend/src/pages/assets/AssetDirectoryPage.jsx`
- `frontend/src/pages/assets/AssetDetailPage.jsx`
- `frontend/src/pages/bookings/BookingPage.jsx`
- `frontend/src/pages/reports/ReportsPage.jsx`
- `frontend/src/pages/logs/ActivityLogsPage.jsx`
- `frontend/src/App.jsx`
- `docs/MODULE_OWNERS.md`

**Summary:**
Implemented frontend pages and service layers for Screens 4 (Asset Registration & Directory), 6 (Resource Booking), 9 (Reports & Analytics), and 10 (Activity Logs & Notifications). All pages use shared components and are fully responsive with beautiful visual dark mode graphics. LocalStorage serves as a robust fallback for offline data persistence when Supabase variables are not set.

**Details:**
- Screen 4: Dynamic searching, category/status/location filtering, custom registration modal with auto-tagging, and a split-tab detailed drawer showing asset info plus allocation and maintenance histories.
- Screen 6: Bookable resource picker, visual hour-based daily scheduler grid, time overlap checks, and modals to reschedule or cancel slots.
- Screen 9: Visual analytical reports utilizing responsive SVG line charts, colored bar charts, progress trackers, density heatmaps, and a local CSV file exporter.
- Screen 10: Notification drawer displaying unread badge count with read/unread toggle controls, and filterable database activity audit logs.

**Open / Decisions Made:**
- ✅ Registered and configured all Devipriya routes inside App.jsx
- ✅ Verified 0 errors on roll build

### [2026-07-12 12:03] — Hari — Frontend Foundation: Shared Components + Screens 1, 2, 3
**Type:** Feature
**Files Changed:**
- `frontend/src/index.css` (full design system — dark theme, CSS variables, all shared styles)
- `frontend/src/App.css` (cleared — all styles now in index.css)
- `frontend/src/App.jsx` (full router — all 10 routes registered with guards)
- `frontend/src/context/AuthContext.jsx` (new — Supabase auth session + employee profile/role)
- `frontend/src/components/shared/AppLayout.jsx` (new)
- `frontend/src/components/shared/Sidebar.jsx` (new — role-aware nav)
- `frontend/src/components/shared/NotificationBell.jsx` (new — realtime unread count)
- `frontend/src/components/shared/StatusBadge.jsx` (new — all status colors)
- `frontend/src/components/shared/KPICard.jsx` (new)
- `frontend/src/components/shared/DataTable.jsx` (new — sortable)
- `frontend/src/components/shared/Modal.jsx` (new)
- `frontend/src/components/shared/ConfirmDialog.jsx` (new)
- `frontend/src/components/shared/RoleGuard.jsx` (new)
- `frontend/src/pages/auth/LoginPage.jsx` (new — Screen 1)
- `frontend/src/pages/auth/SignupPage.jsx` (new — Screen 1, Employee-only)
- `frontend/src/pages/dashboard/DashboardPage.jsx` (new — Screen 2)
- `frontend/src/pages/org/OrgSetupPage.jsx` (new — Screen 3, Admin-only)
- `frontend/src/pages/PlaceholderPage.jsx` (new — shown for unbuilt screens)
- `frontend/package.json` + `package-lock.json` (added react-router-dom)

**Summary:**
Built all of Hari's assigned frontend work: the full design system (dark theme, CSS variables, all component styles), all 9 shared components, AuthContext with Supabase, and all 3 screens (Login/Signup, Dashboard, Org Setup). Also set up the App router with all 10 routes registered — Devipriya and Abinivas' routes show a placeholder page until they build their screens. Build passes with 0 errors.

**Details:**
- Design system: `#07111f` dark base, Inter font, CSS variables for colors/borders/shadows, all status badge colors, KPI card, table, modal, button, form, sidebar styles
- AuthContext: reads Supabase session + fetches employee profile (name, role, department_id) from `employees` table
- Sidebar: role-aware — hides links the user can't access (e.g. Org Setup only shows for Admin)
- Screen 1 Login: Supabase signInWithPassword, forgot password email flow
- Screen 1 Signup: Employee-only, no role picker, confirmation screen after success
- Screen 2 Dashboard: 6 KPI cards (Available, Allocated, Maintenance, Bookings, Transfers, Overdue), overdue alert banner, recent activity feed, quick actions
- Screen 3 Org Setup (Admin-only): 3 tabs — Departments CRUD (with head + parent hierarchy), Asset Categories CRUD (with JSON custom fields), Employee Directory (search, edit, role promotion — the ONLY place in the app)
- All 10 routes in App.jsx with PrivateRoute and AdminRoute guards

**Open / Decisions Made:**
- ✅ react-router-dom added to frontend deps
- ✅ Build verified: 0 errors, 0 warnings
- ⏳ Devipriya: replace PlaceholderPage for /assets, /bookings, /reports, /logs in App.jsx when ready
- ⏳ Abinivas: replace PlaceholderPage for /allocations, /maintenance, /audit in App.jsx when ready
- ⏳ Jason: `employees` table needed for AuthContext to work (Prisma schema + migration)

### [2026-07-12 11:41] — Hari — Team Names & UI Re-split
**Type:** Docs | Planning
**Files Changed:**
- `docs/UI_SPLIT.md` (rewritten — real names, fair 3-way split across all 10 screens)
- `docs/MODULE_OWNERS.md` (updated — real names, Jason owns all backend)
- `docs/TEAM_PROMPT.md` (updated — team section replaced with real names)
- `docs/CHANGELOG.md` (this entry)

**Summary:**
Replaced all placeholder codenames with real team member names. Team is 4 people total: Hari, Devipriya, Abinivas on frontend UI, Jason on backend. Redistributed all 10 screens fairly across the 3 frontend members (was previously split among 5 codenames with Screen 8 unassigned — now all 10 screens have an owner).

**Details:**
- **Hari** → Screen 1 (Login/Signup) + Screen 2 (Dashboard) + Screen 3 (Org Setup) + All Shared Components
- **Devipriya** → Screen 4 (Asset Directory) + Screen 6 (Resource Booking) + Screen 9 (Reports) + Screen 10 (Activity Logs)
- **Abinivas** → Screen 5 (Allocation & Transfer) + Screen 7 (Maintenance) + Screen 8 (Audit)
- **Jason** → All of `/backend` — API endpoints, Prisma schema, Auth, DB
- Screen 8 (Audit) now assigned to Abinivas — no longer unassigned
- Start order: Hari builds shared components first, then Devipriya & Abinivas work in parallel

**Open / Decisions Made:**
- ✅ All 10 screens now have owners
- ✅ Jason owns all backend — frontend team does not touch `/backend`

### [2026-07-12 11:23] — Hari — Merge Resolution: main → dev2
**Type:** Config | Schema | Docs
**Files Changed:**
- `backend/package.json` (added `@supabase/supabase-js`, `ws` as dependencies)
- `backend/prisma.config.js` (new — Prisma config file)
- `backend/prisma/schema.prisma` (added `users` model with UUID + email)
- `backend/prisma/migrations/20260712050600_create_users/migration.sql` (new)
- `backend/prisma/migrations/20260712051002_db_uuid/migration.sql` (new)
- `backend/prisma/migrations/migration_lock.toml` (new)
- `backend/src/lib/supabase.js` (new — server-side Supabase client using service role key)
- `backend/src/lib/checkDB.js` (new)
- `backend/src/lib/createTable.js` (new)
- `backend/src/lib/insertData.js` (new)
- `frontend/package.json` (added `@supabase/supabase-js`, `tailwindcss`, `@tailwindcss/vite`)
- `frontend/src/App.jsx` (replaced default Vite template with AssetFlow shell + Supabase test button)
- `frontend/src/App.css` (commented out old Vite CSS, added Tailwind import + dark base styles)
- `frontend/src/lib/supabase.js` (new — browser-side Supabase client using VITE_SUPABASE_ANON_KEY)
- `frontend/vite.config.ts` (added Tailwind Vite plugin)
- `docs/APIS.md` (new — full REST API documentation for all modules)
- `package-lock.json` (updated)

**Summary:**
Resolved merge conflict between `main` and `dev2` branch. The incoming branch introduced Supabase as the database/auth layer, added Tailwind CSS v4 to the frontend, ran the first Prisma migration (users table with UUID), replaced the default Vite placeholder with a minimal AssetFlow shell, and documented all REST API endpoints in `docs/APIS.md`. All conflicts were resolved keeping the best of both branches, then committed and pushed.

**Details:**
- ✅ Supabase client set up on both frontend (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and backend (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- ✅ First Prisma migration: `users` table with `id (UUID)`, `email (unique)`, `created_at`
- ✅ Tailwind CSS v4 wired in via `@tailwindcss/vite` plugin in `vite.config.ts`
- ✅ Dark mode base styles added to `App.css` (background `#07111f`, Inter font)
- ✅ `docs/APIS.md` created — full REST API docs for all screens, use as reference when building endpoints
- ✅ Pushed to remote — teammates can now pull and start their modules

**Open / Decisions Made:**
- ✅ Decided: **Supabase** is the database (Postgres hosted on Supabase) — update all teammates
- ✅ Decided: **Tailwind CSS v4** is the styling framework — all teammates must use Tailwind classes
- ⚠️ `.env` files with Supabase keys are NOT committed — each teammate needs to create their own `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend) and `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend)
- ⏳ Full Prisma schema still needs all models (assets, allocations, bookings, etc.) — only `users` exists so far

### [2026-07-12 11:14] — Hari — UI Planning & Screen Split
**Type:** Docs | Planning
**Files Changed:**
- `docs/UI_SPLIT.md` (created — full UI split by team member)
- `docs/MODULE_OWNERS.md` (updated — added frontend screen owners from wireframe)
- `docs/CHANGELOG.md` (this entry)

**Summary:**
Analysed the Excalidraw wireframe (`docs/AssetFlow - Enterprise Asset & Resource Management System - 8 hours.excalidraw`) and the team screenshot (`Screenshot 2026-07-12 111301.png`) to identify how the 10 screens are split among the 3 team members. Created `UI_SPLIT.md` with exact screen assignments, folder structure, shared components list, and per-person notes from the wireframe.

**Details:**
- **Hari** → Screen 1 (Login/Signup), Screen 2 (Dashboard), Screen 4 (Asset Directory) + all shared components
- **penguin** → Screen 3 (Organization Setup — 3 tabs: Departments, Asset Categories, Employee Directory with role promotion)
- **Green Clam** → Screen 5 (Asset Allocation & Transfer)
- **Calm Mongoose** → Screen 6 (Resource Booking) + Screen 7 (Maintenance Management)
- **dhfee'aosh** → Screen 9 (Reports & Analytics) + Screen 10 (Activity Logs & Notifications)
- Screen 8 (Asset Audit) is **unassigned** — needs a team member
- Defined `frontend/src/` folder structure: `components/shared/`, `pages/`, `hooks/`, `services/`, `context/`
- Listed all 9 shared components that Hari will build first
- Noted design decisions still pending: component library (shadcn/ui recommended), theme, auth storage, overdue detection approach, `Reserved` state semantics

**Open / Decisions Made:**
- ⏳ Screen 8 (Audit) — unassigned, team needs to decide who takes it
- ⏳ Component library — shadcn/ui is recommended but needs team agreement before anyone starts
- ⏳ Design theme — dark default suggested
- ⏳ Auth token storage — httpOnly cookie vs localStorage, needs decision before auth is built

### [2026-07-12 10:52] — Hari — Project Setup & Documentation System
**Type:** Docs | Config
**Files Changed:**
- `docs/CHANGELOG.md` (created — this file)
- `docs/PRODUCT_CONTEXT.md` (already existed at root, to be moved here)
- `docs/TEAM_PROMPT.md` (created — prompt for teammates' AI agents)
- `docs/MODULE_OWNERS.md` (created — who owns what)

**Summary:**
Established the shared documentation system in the `docs/` folder. The concept: every team member and their AI agent appends to `CHANGELOG.md` — never overwrites — so all changes are traceable by person, by module, and by time. Also created `TEAM_PROMPT.md` so teammates can paste a single prompt into their own AI assistant (Claude, Copilot, Cursor, etc.) to get full context on the project without needing to read every file manually.

**Details:**
- Created `docs/CHANGELOG.md` — this living log file, append-only, attribution by name
- Created `docs/TEAM_PROMPT.md` — a ready-to-paste prompt for teammates' LLMs
- Created `docs/MODULE_OWNERS.md` — maps each module to the teammate responsible
- Confirmed current project state: scaffolded only (frontend default Vite template, backend has only `server.js` health endpoint, Prisma schema is empty)

**Open / Decisions Made:**
- ✅ Decided: **Prisma** as the ORM (already in `backend/package.json`)
- ✅ Decided: **React + Vite** for frontend (scaffolded)
- ⏳ Open: JWT vs session auth — needs team decision before any protected routes are built
- ⏳ Open: Component library — shadcn/ui vs MUI — needs team decision on Day 1
- ⏳ Open: `Reserved` state semantics — booking-scoped or general flag? (See `PRODUCT_CONTEXT.md §5`)
- ⏳ Open: Prisma schema still empty — needs full model definitions before any feature work

---
