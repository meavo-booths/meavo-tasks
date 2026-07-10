# Agent guide — meavo-tasks

Quick orientation for AI agents working in this repo. Read this before exploring blindly.

**Cursor:** `.cursor/rules/core.mdc` is always applied. See also `domain.mdc` and `api.mdc` when editing matching paths.

## What this repo does

Team task management for Meavo (`tasks.meavo.app`): a personal inbox grouped by due date, plus team and shared kanban boards with drag-and-drop, cross-tool links to other Meavo apps, and Slack digests. Used by all Meavo staff with a Tasks tool card granted in the gateway.

## Stack

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3
- Prisma 6 via `@meavo/db` (shared Neon Postgres — same `DATABASE_URL` as gateway)
- NextAuth v5 (JWT) — Credentials + invite-only Google, gated on the Tasks tool card
- `@meavo/navigation` top nav + tool switcher; hosted on Vercel

## First files to read

| Task | Start here |
|------|------------|
| Inbox grouping (Overdue / Today / Upcoming) | `src/app/(app)/page.tsx`, `src/lib/today-tasks.ts`, `src/components/inbox-dashboard.tsx` |
| Kanban board UI / drag-and-drop | `src/components/board-view.tsx`, `src/components/board-page-client.tsx` |
| Board list view | `src/app/(app)/boards/[workspaceId]/list/page.tsx`, `src/components/task-list-view.tsx` |
| Task create / edit / complete / move | `src/app/actions/tasks.ts` |
| Boards, invites, team scoping | `src/app/actions/workspaces.ts`, `src/lib/domain/workspace-bootstrap.ts`, `src/lib/domain/workspace-members.ts` |
| Who can view/edit a board or task | `src/lib/domain/task-authz.ts` |
| Cross-tool links (deals, batches, RP, assemblies) | `src/app/actions/links.ts`, `src/lib/integrations/link-resolver.ts` |
| Slack digests (team + personal crons) | `src/app/api/cron/*/route.ts`, `src/lib/integrations/slack.ts`, `src/lib/settings/personal-digest.ts` |
| Todoist export, per-user settings | `src/app/actions/settings.ts`, `src/lib/settings/`, `src/lib/integrations/todoist.ts` |
| Task detail modal | `src/components/task-detail-modal.tsx` |
| Auth & access | `src/lib/access.ts` (tool-card gate), `src/lib/auth.ts`, `src/middleware.ts` |
| DB schema | Owned by the **meavo-db** repo (consumed as `@meavo/db`); idempotent SQL copies in `scripts/*.sql` |
| Tests | N/A — no test suite; verify manually with `npm run dev` |

## Do NOT

- Edit the Prisma schema in this repo — schema lives in **meavo-db**; bump the `@meavo/db` git ref in `package.json` instead
- Run `prisma db push` — it is intentionally disabled in `package.json` (shared DB; a stale schema can drop other apps' tables)
- Write to other apps' tables (`Deal`, `FactoryProductionBatch`, `RpRequest`, `Assembly`, …) — this app reads them only to resolve links
- Look up the tool card by `linkedAppKey` at runtime — always use `TASKS_CARD_ID` from `src/lib/tasks-config.ts`
- Import `src/lib/auth.ts` (Prisma-backed) in `middleware.ts` — edge runtime; use `src/lib/auth.config.ts`
- Add shadcn, Radix, MUI, or any external component library — use `src/components/ui.tsx`
- Build a custom top nav — the shell comes from `@meavo/navigation`
- Skip the `CRON_SECRET` check on `/api/cron/*` routes
- Send email directly — satellites enqueue to `NotificationOutbox` via `src/lib/notifications/enqueue.ts`; only gateway sends email (Slack webhook posts from crons are the approved exception here)
- Commit secrets or `.env.local`

## Commands

```bash
npm install        # runs prisma generate via postinstall
npm run dev
npm run lint
npm run build      # prisma generate + scripts/bootstrap-db.mjs (skips without DATABASE_URL) + next build
```

## Conventions

1. Mutations are Server Actions in `src/app/actions/` returning `{ error?: string }`; call `revalidatePath()` after writes.
2. Every action re-checks access: `getTasksUser()` from `src/lib/access.ts`, then `requireWorkspaceEdit()` / `requireTaskEdit()` from `src/lib/domain/task-authz.ts`.
3. Authorization and query logic live in `src/lib/domain/` — keep actions and pages thin.
4. Server Components by default; `"use client"` only for interactive leaves (board, modals, pickers).
5. Fire-and-forget side effects (Slack posts) use `.catch(console.error)` — never block the mutation.

## Scoped task template (preferred from user)

```
Area/route: (e.g. /boards/[workspaceId] or inbox)
Behaviour: [what should happen]
Reference: [screenshot, sibling app, or doc, if any]
Out of scope: [auth / schema / other apps]
```

## Related docs

- [docs/architecture.md](docs/architecture.md) — stack, layout, data flow
- [docs/domain.md](docs/domain.md) — business rules, personas, mutation map
- [docs/data-model.md](docs/data-model.md) — database tables
- [CONTRIBUTING.md](CONTRIBUTING.md) — PR process
