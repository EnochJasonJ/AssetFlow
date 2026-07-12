# Installed Packages

This document lists all the packages and dependencies installed in the frontend and backend modules of the AssetFlow project.

---

## FRONTEND

**Dependencies** (Core libraries for the application):
- `@supabase/supabase-js` (^2.109.0): Supabase client for database and authentication.
- `@tailwindcss/vite` (^4.3.2): Vite plugin for Tailwind CSS.
- `react` (^19.2.7): Core React library.
- `react-dom` (^19.2.7): React package for working with the DOM.
- `tailwindcss` (^4.3.2): Utility-first CSS framework for styling.

**Dev Dependencies** (Tools used during development):
- `@vitejs/plugin-react` (^6.0.3): Vite plugin for fast React development.
- `oxlint` (^1.71.0): Fast JavaScript linter.
- `vite` (^8.1.1): Next-generation frontend tooling (dev server & bundler).

---

## BACKEND

**Dependencies** (Required for the backend to run):
- `@supabase/supabase-js` (^2.109.0): Supabase client for database interactions.
- `ws` (^8.21.0): WebSocket client, specifically required for Supabase Realtime in Node.js environments.

**Dev Dependencies** (Tools and libraries for building the API):
- `cors` (^2.8.6): Middleware for enabling Cross-Origin Resource Sharing.
- `dotenv` (^17.4.2): Module to load environment variables from a `.env` file.
- `express` (^5.2.1): Fast, unopinionated, minimalist web framework for Node.js.
- `prisma` (^7.8.0): Next-generation Node.js and TypeScript ORM (CLI for migrations and schema management).
