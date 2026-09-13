# CodeSnippet Sandbox & Secure Previewer

Write and preview HTML, CSS, and JS code in an isolated sandbox, with instant shareable preview links, custom expiry rules, and security enforcement.

## Run Locally

**Prerequisites:** Node.js, a Postgres database (see [Database setup](#database-setup))

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres connection string.
3. Create the database schema (one-time):
   `npm run db:init`
4. Run the app:
   `npm run dev`

## Project structure

- `src/` — the Vite + React frontend.
- `api/app.ts` — the Express API (routes for creating/fetching/revoking preview links). Shared by both local dev and the Vercel deployment.
- `api/index.ts` — the entry point Vercel picks up as a serverless function, handling all `/api/*` requests.
- `api/db.ts` — Postgres data access layer (`@neondatabase/serverless`).
- `server.ts` — local dev / self-hosted server only. Mounts the same API app and serves the Vite app (dev middleware, or `dist/` in production). Not used by Vercel.
- `scripts/init-db.ts` — creates the `previews` table.

## Deploying to Vercel

This project is set up to deploy on Vercel with zero extra config:

- `vercel.json` builds the frontend with `vite build` into `dist/`, and routes `/api/*` to the `api/index.ts` serverless function while everything else falls back to `index.html` (SPA routing for links like `/preview/:id`).
- The API no longer uses the local filesystem or an in-memory store (both are unreliable on serverless), it reads/writes to Postgres instead.

Steps:

1. Push this repo to GitHub (already done) and [import it into Vercel](https://vercel.com/new).
2. Connect a Postgres database (see below) **before your first deploy** so `DATABASE_URL` is set.
3. Deploy. Vercel will run `vite build` for the frontend and deploy `api/index.ts` as a Vercel Function.

You can also deploy from the CLI:

```bash
npm i -g vercel
vercel link
vercel env pull   # pulls DATABASE_URL and other project env vars into .env.local
vercel deploy
```

## Database setup

Vercel no longer offers its own hosted "Vercel Postgres" product directly — as of late 2024 it moved all existing Vercel Postgres databases to [Neon](https://vercel.com/marketplace/neon), and new databases are provisioned the same way, through the **Vercel Marketplace**. This project uses `@neondatabase/serverless`, which works with Neon's connection strings.

### 1. Create the database (Vercel dashboard)

1. Open your project on [vercel.com](https://vercel.com/dashboard) → **Storage** tab.
2. Click **Create Database** (or **Browse Marketplace**) → select **Neon** (Serverless Postgres).
3. Choose "Create New Neon Account" (or connect an existing one), pick a region, and name the database.
4. On the "Connect Project" step, select this project and the environments you want it available in (Production, Preview, Development are all recommended).
5. Optionally enable **Preview Branching** under Advanced Options, so every preview deployment gets its own database branch.
6. Click **Connect**. Vercel automatically injects these environment variables into your project:
   - `DATABASE_URL` — pooled connection string (use this one; the app is already configured to read it)
   - `DATABASE_URL_UNPOOLED` — direct connection string
   - `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD` — individual connection pieces, if you need them

### 2. Create the schema

The `previews` table needs to exist before the API can read/write. Run this once, from your machine, with `DATABASE_URL` set (either pulled via `vercel env pull` or pasted into `.env`):

```bash
npm run db:init
```

This is idempotent (`CREATE TABLE IF NOT EXISTS`), so it's safe to re-run.

### 3. Local development

```bash
vercel link      # connect this folder to your Vercel project (one-time)
vercel env pull   # writes .env.local with DATABASE_URL etc.
npm run dev
```

Alternatively, just set `DATABASE_URL` yourself in `.env` (e.g. pointing at a Neon branch, or any other Postgres instance) — the app doesn't depend on anything Vercel-specific beyond the connection string.
