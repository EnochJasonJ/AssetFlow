# CLAUDE.md — AssetFlow

This file is for Claude Code specifically. It doesn't repeat what's already
in the repo — read these two first, in order:

1. **[`AGENTS.md`](AGENTS.md)** — repo layout, setup commands, coding
   conventions, working agreements (applies to any coding agent, including you).
2. **[`docs/PRODUCT_CONTEXT.md`](docs/PRODUCT_CONTEXT.md)** — the full
   product spec: entities, state machines, workflows, business rules.
   This is the source of truth for *what* AssetFlow does. Consult the
   relevant section before implementing anything touching asset lifecycle,
   allocation/transfer, booking, maintenance, or audits.

Everything below is Claude-Code-specific: how to work in *this* repo using
Claude Code's tools well.

## Quick orientation for a new session

If you're picking this up cold: this is a hackathon ERP module (React +
Express + Postgres, monorepo) for tracking physical assets and shared
resources. The hard parts are the business rules, not the UI — double-
allocation prevention, booking overlap validation, the maintenance
approval gate, and audit-cycle closing all have specific correctness
requirements in PRODUCT_CONTEXT.md §5–9. Read those before writing
allocation/booking/maintenance/audit code.

## Suggested workflow for feature work

1. **Plan first for anything multi-file.** Use plan mode (or just think out
   loud) before touching allocation, booking, maintenance, or audit logic —
   these have cross-cutting effects (asset status + notifications +
   activity log all update together). Don't start editing files mid-thought.
2. **Check PRODUCT_CONTEXT.md's checklist (§12)** before considering a
   feature done, not just before starting it.
3. **Write the state-transition test alongside the code**, not after —
   these are the rules a hackathon demo will get grilled on.
4. **Use subagents for parallel, independent work** — e.g. one agent
   scaffolding the Reports screen's read-only queries while another builds
   the Audit Cycle close-transaction logic. Don't parallelize anything that
   touches the same tables/files.
5. **Run lint/tests before declaring a task complete** (commands in
   AGENTS.md). Don't hand back a "done" that hasn't been run.

## Things to flag to the team rather than silently deciding

- Any change to the state machine transitions in PRODUCT_CONTEXT.md §5.
- Auth strategy (JWT vs session) if it isn't locked in yet — check
  AGENTS.md's "Conventions" section first; if still unset, ask rather than
  picking silently, since it affects every protected route.
- Whether `Reserved` is booking-scoped or a general availability flag —
  flagged as an open call in PRODUCT_CONTEXT.md §5, pick one, implement,
  and update the doc, but mention it in the PR description so the team
  knows a decision was made.

## What not to do

- Don't add any UI or API path that lets a user pick/elevate their own
  role. Signup is Employee-only, full stop (see PRODUCT_CONTEXT.md §3).
- Don't implement business rules (conflict blocking, overlap checks,
  approval gates) only in the frontend — every one of them must be
  re-enforced server-side.
- Don't invent scope creep into purchasing/invoicing/accounting — explicitly
  out of scope for this hackathon build.
