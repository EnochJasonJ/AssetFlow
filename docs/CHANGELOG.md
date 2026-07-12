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
