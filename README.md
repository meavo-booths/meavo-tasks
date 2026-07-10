# meavo-tasks

Team task management for Meavo (`tasks.meavo.app`) — personal inbox lists and shared kanban boards.

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- Shared Neon Postgres via `@meavo/db` (Prisma)
- NextAuth v5 with tool-card access gating
- `@meavo/navigation` for the cross-app tool switcher

## Features

- **My Inbox** — personal tasks grouped by due date (Overdue / Today / Upcoming / No date)
- **Boards** — kanban columns with drag-and-drop
- **Team boards** — scoped to Gateway `Team` membership
- **Shared boards** — invite specific users as viewers or editors
- **Cross-tool links** — attach deals, factory batches, RP requests, assemblies
- **Slack digest** — weekday cron for overdue and due-today tasks

## Local setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` (same Neon DB as gateway).
2. Apply the task schema from `meavo-db`:
   ```bash
   cd ../meavo-db
   npx prisma db execute --file scripts/add-task-tables.sql --schema prisma/schema.prisma
   ```
3. Seed the Tasks tool card in gateway (or run full gateway `db:seed`).
4. Grant yourself access via gateway Admin → Tool cards.
5. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `TASKS_TOOL_CARD_ID`, `MEAVO_APP_KEY=tasks`, `GATEWAY_URL`.

Optional: `SLACK_TASK_DIGEST_WEBHOOK_URL`, `TASK_DIGEST_TIMEZONE`, `CRON_SECRET`.

## Deployment

Create a Vercel project at `tasks.meavo.app` with the same env vars as production gateway (`DATABASE_URL`, `AUTH_SECRET`, etc.).

## Documentation

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](AGENTS.md) | Quick orientation for AI coding agents |
| [.cursor/rules/](.cursor/rules/) | Always-on Cursor rules (stack, security, UI) |
| [docs/architecture.md](docs/architecture.md) | Stack, layout, data flow |
| [docs/domain.md](docs/domain.md) | Business rules, personas, mutation map |
| [docs/data-model.md](docs/data-model.md) | Database tables |
| [CONTRIBUTING.md](CONTRIBUTING.md) | PR process |
