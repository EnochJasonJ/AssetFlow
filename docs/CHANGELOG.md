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
