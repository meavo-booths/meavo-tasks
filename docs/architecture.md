# Architecture — meavo-tasks

Team task management for Meavo at **tasks.meavo.app** — personal inbox lists plus team/shared kanban boards, running as a satellite of the meavo-gateway ecosystem on one shared Neon Postgres.

**Further reading:**
- [domain.md](domain.md) — business rules, personas, mutation map
- [data-model.md](data-model.md) — database tables
- [AGENTS.md](../AGENTS.md) — quick orientation for AI agents

## Sibling repos (meavo-booths)

| Repo | Relationship |
|------|--------------|
| `meavo-db` | Owns the canonical Prisma schema consumed here as `@meavo/db` (git ref in `package.json`) |
| `meavo-gateway` | Owns identity (`User`, `Team`), tool cards, and `ToolCardAccess`; grants/revokes Tasks access; delivers `NotificationOutbox` |
| `meavo-navigation` | `@meavo/navigation` — shared top nav + tool switcher |
| `sales`, `Meavo-Factory`, `meavo-rp`, `assembly`, `meavo-mrp` | Read-only: tasks deep-link to their entities via `src/lib/integrations/link-resolver.ts` |

## Stack decisions

- **Prisma via `@meavo/db`** — one shared Neon Postgres for all Meavo apps; this repo owns only the `Task*` tables and never edits the schema locally.
- **NextAuth v5 (JWT)** — Credentials + invite-only Google, both gated on the Tasks tool card so gateway admin revocation is immediate.
- **Vercel** — hosting, cron scheduler (`vercel.json`), analytics/speed insights.
- **No test suite** — changes are verified manually via `npm run dev`.

## Repository layout

```
src/
  app/
    (app)/                 # authenticated routes: inbox (page.tsx), boards/, settings/
    login/                 # public login
    actions/               # Server Actions: tasks, workspaces, links, settings, auth
    api/                   # auth/[...nextauth], cron/*, health — nothing else
  components/              # ui.tsx kit, board views, modals, mobile nav
  hooks/                   # use-media-query
  lib/
    domain/                # task-authz, task-queries, workspace-bootstrap, workspace-members
    integrations/          # slack, todoist, link-resolver (cross-app deep links)
    settings/              # per-user settings, personal digest, todoist sync
    notifications/         # enqueue.ts → NotificationOutbox (gateway delivers)
    access.ts              # getTasksUser() tool-card gate
    auth.ts / auth.config.ts / middleware.ts (in src/)
scripts/                   # idempotent SQL copies + bootstrap-db.mjs (runs during build)
```

## Data flow

```
Browser
  → middleware (src/middleware.ts): redirect to /login unless authed (APIs pass through)
  → (app)/layout.tsx: getTasksUser() → redirect if tool card revoked
  → page (Server Component) reads via src/lib/domain/ + Prisma
  → user mutates via Server Action (src/app/actions/*)
      → getTasksUser() → requireWorkspaceEdit/requireTaskEdit
      → Prisma write (shared Neon) → revalidatePath()
      → fire-and-forget Slack post where relevant (.catch(console.error))

Vercel cron (weekdays 07:00 UTC)
  → /api/cron/task-digest            → org digest to SLACK_TASK_DIGEST_WEBHOOK_URL
  → /api/cron/personal-slack-digest  → per-user digests to each user's webhook
```

## API surface

- **Server Actions** (`src/app/actions/`) — all mutations: tasks, workspaces/boards, external links, settings, login/logout.
- **REST routes** (`src/app/api/`) — `auth/[...nextauth]`, `cron/task-digest`, `cron/personal-slack-digest`, `health` (`SELECT 1`). No other endpoints.

## Scheduled jobs

| Path | Schedule (`vercel.json`) | Purpose |
|------|--------------------------|---------|
| `/api/cron/task-digest` | `0 7 * * 1-5` | Org-wide Slack digest of overdue + due-today tasks |
| `/api/cron/personal-slack-digest` | `0 7 * * 1-5` | Personal Slack digests for users who enabled them in Settings |

## Environment variables

Names only — no `.env.example` is committed (`.gitignore` ignores `.env*`); set these in `.env.local` / Vercel:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Shared Neon Postgres (same as gateway) |
| `AUTH_SECRET`, `AUTH_URL` | NextAuth v5 |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Optional invite-only Google sign-in |
| `TASKS_TOOL_CARD_ID` | Tool-card gate (defaults to `seed-tasks-tool`) |
| `MEAVO_APP_KEY` (`tasks`), `GATEWAY_URL` | `@meavo/navigation` tool switcher |
| `CRON_SECRET` | Bearer auth for `/api/cron/*` |
| `SLACK_TASK_DIGEST_WEBHOOK_URL` | Optional org digest webhook |
| `TASK_DIGEST_TIMEZONE` | Optional digest timezone (default `Europe/Sofia`) |

## Deployment

Vercel project at `tasks.meavo.app`. `npm run build` runs `prisma generate`, then `scripts/bootstrap-db.mjs` (idempotent: creates `Task*` tables if missing, seeds the `seed-tasks-tool` card, grants access to all existing users — skips entirely without a `DATABASE_URL`), then `next build`. Crons are configured in `vercel.json`.
