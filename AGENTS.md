# AGENTS.md — AssetFlow

Operating instructions for any coding agent (Codex, Claude Code, Cursor,
etc.) working in this repo. For the full product spec — entities, state
machines, workflows, business rules — see **[`docs/PRODUCT_CONTEXT.md`](docs/PRODUCT_CONTEXT.md)**.
Read it before implementing any feature that touches asset state,
allocation, booking, maintenance, or audit logic. This file is about *how*
to work in the repo; PRODUCT_CONTEXT.md is about *what* the product does.

## What this project is

AssetFlow — an Enterprise Asset & Resource Management system (hackathon
build). React frontend, Node/Express backend, PostgreSQL database, all in
one monorepo. Not a full ERP: no purchasing/invoicing/accounting.

## Repo layout

```
/frontend        React app (Vite)
/backend          Express API
/backend/src/db   migrations + seed data
/docs             product & architecture docs (read PRODUCT_CONTEXT.md first)
```

Adjust this section as soon as the real structure is scaffolded — keep it
accurate, agents rely on it to navigate.

## Setup & commands

Fill these in as soon as they're real — an agent that runs a stale command
wastes a turn or breaks the build. Suggested shape:

```bash
# install
cd frontend && npm install
cd backend && npm install

# dev
npm run dev        # in /backend — starts API
npm run dev         # in /frontend — starts Vite dev server

# database
npm run migrate     # in /backend — run migrations
npm run seed         # in /backend — seed dev data (departments, categories, demo employees)

# tests
npm test             # in /backend
npm test             # in /frontend

# lint
npm run lint
```

## Conventions

- **Language:** JavaScript or TypeScript — pick one for the whole repo on
  day one and don't mix. (TypeScript strongly recommended given how many
  enums/state machines this app has — catches invalid status transitions
  at compile time.)
- **API style:** REST, `/api/v1/...`, resource-oriented routes
  (`/api/v1/assets`, `/api/v1/bookings`, etc.). JSON in/out. Standard HTTP
  status codes — 409 for conflict (e.g. double-allocation attempt), 422 for
  validation errors, not a generic 400 for everything.
- **DB access:** one query layer (Prisma or Knex) — no raw `pg` client
  calls scattered alongside ORM calls. All multi-step state changes
  (allocate, return, approve maintenance, close audit) go through DB
  transactions — see PRODUCT_CONTEXT.md §12 checklist.
- **Auth:** JWT-based, role embedded in a verified token, re-checked
  server-side per request — never trust a role sent in a request body.
- **Naming:** snake_case in the DB, camelCase in JS/TS, asset tags like
  `AF-0001` (zero-padded, sequential, generated server-side).
- **Commits:** small, one logical change per commit. Reference the screen
  number from PRODUCT_CONTEXT.md §11 in the commit/PR title when relevant
  (e.g. `[Screen 5] block double-allocation with row lock`).
- **Tests:** unit tests for every state-machine transition and every
  conflict rule (double-allocation, booking overlap, maintenance approval
  gate). These are the rules most likely to have hackathon-judge-visible
  bugs — prioritize testing them over CSS polish.

## Working agreements for agents

- Before generating any endpoint or component touching assets, bookings,
  maintenance, or audits, check the relevant section of
  `docs/PRODUCT_CONTEXT.md` — don't infer business rules from the entity
  name alone (e.g. "Reserved" has a specific meaning, don't guess).
- If a requirement is ambiguous or PRODUCT_CONTEXT.md has an open decision
  (marked "decide and document" or similar), make a reasonable choice,
  implement it, and **update PRODUCT_CONTEXT.md in the same PR** so the
  decision doesn't get re-litigated by the next agent/teammate.
- Don't add role self-elevation anywhere, even for dev convenience (e.g. no
  "become admin" debug button) — it's a stated non-negotiable rule and
  hackathon judges may specifically probe this.
- Prefer server-side enforcement of business rules over client-side-only
  checks. The UI can disable a button; the API must still reject the
  request independently.
- When touching state transitions (asset status, booking status,
  maintenance status, transfer status), always validate the *current*
  state before writing the *next* state — reject invalid transitions with
  a clear error rather than overwriting blindly.

## Out of scope (don't build)

Purchasing workflows, invoicing, accounting integrations, payment
processing. Acquisition cost is a stored number for reports only.
