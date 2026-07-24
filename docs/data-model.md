# Data model — meavo-tasks

Canonical schema lives in the **meavo-db** repo (`prisma/schema.prisma`), consumed here as `@meavo/db`.

Local reference: `node_modules/@meavo/db/prisma/schema.prisma` (read-only). Idempotent SQL copies of the task tables live in `scripts/*.sql` and are applied by `scripts/bootstrap-db.mjs` during build.

**Do not edit schema in this repo** — make changes in meavo-db, tag a release, then bump the `@meavo/db` git ref in `package.json`. `prisma db push` is intentionally disabled (shared DB).

Pinned version: `@meavo/db` `github:meavo-booths/meavo-db#v0.29.0` (check `package.json` for current).

## Entity relationship

```
User (gateway) ──owns──> TaskWorkspace <──teamId── Team (gateway)
                              │
                ┌─────────────┼──────────────┐
        TaskWorkspaceMember   TaskBoardColumn │
        (userId, role)             │          │
                                   └──< Task >┘
                                        │
                    ┌───────────────────┼───────────────────┐
              TaskAssignee        TaskExternalLink    TaskComment
              (userId, scope)     (linkedApp, …)      (parentId?, resolvedAt?)

User ──1:1──> TaskUserSettings      User ──1:n──> TaskIntegration
```

## Core tables / models

### `TaskWorkspace`

A board / list. `type`: `PERSONAL` (auto-created inbox, private), `TEAM` (gateway `teamId`), `SHARED` (explicit members).

| Field | Notes |
|-------|-------|
| `ownerId` | FK → gateway `User`; cascade delete |
| `teamId` | Nullable FK → gateway `Team` (TEAM boards); `SET NULL` on team delete |
| `color` | Hex string, defaults to blush `#EEDCDC` |
| `archivedAt` | Soft-archive timestamp |

### `TaskWorkspaceMember`

Shared-board membership. Unique on `(workspaceId, userId)`; `role` is `VIEWER` or `EDITOR`. Not used for `PERSONAL` / `TEAM` boards.

### `TaskBoardColumn`

Kanban column, ordered by `position` within a workspace. Defaults seeded from `DEFAULT_COLUMNS` (`src/lib/tasks-config.ts`).

### `Task`

| Field | Notes |
|-------|-------|
| `columnId` | Nullable — `SET NULL` if the column is deleted |
| `position` | Order within column (drag-and-drop) |
| `priority` / `status` | Enums `TaskPriority` / `TaskStatus` (see domain.md) |
| `startDate` / `dueDate` | `DATE` (no time component) — inbox grouping keys off `dueDate` |
| `createdById` | FK → `User`, `RESTRICT` on delete |
| `completedAt` | Set by `completeTask`, cleared on reopen |

### `TaskAssignee`

Unique on `(taskId, userId)`. `scope`: `MEMBER` (board member) or `EXTERNAL` (task-only view access — see `docs/domain.md`).

### `TaskExternalLink`

Cross-tool link. `linkedApp` enum: `SALES | FACTORY | RP | ASSEMBLY | MRP`; stores `entityType`, `entityId`, plus denormalized `displayLabel` and `deepLinkUrl` resolved at attach time by `link-resolver.ts`.

### `TaskComment`

One-level discussion threads on a task (schema in `@meavo/db` v0.29.0+; bootstrap SQL in `scripts/add-task-comments.sql`).

| Field | Notes |
|-------|-------|
| `authorId` | FK → `User`, `RESTRICT` on delete |
| `parentId` | Nullable FK → `TaskComment` — `null` = root; set = reply to a **root** only (enforced in actions) |
| `body` | Plain text |
| `resolvedAt` / `resolvedById` | Set on root comments only; cascade-delete replies when a root is deleted |

Loaded on demand in the task detail modal (`listTaskComments`) — not included in board/inbox list queries.

### `TaskUserSettings` / `TaskIntegration`

Per-user Slack digest settings (PK `userId`) and integration rows (unique `(userId, provider)`; today only `todoist`, export-only, token in `accessToken`).

## Shared tables read (never written, except noted)

`User`, `Team`, `TeamMember`, `ToolCard` / `ToolCardAccess` (written only by `scripts/bootstrap-db.mjs` seed), `LoginThrottle` (written by login flow), `NotificationOutbox` / `NotificationEventSetting` (via `enqueue.ts`), and — read-only for link resolution — `Deal`, `FactoryProductionBatch`, `RpRequest`, `Assembly`.

## Queries agents should reuse

- `src/lib/domain/task-queries.ts` — `getTaskById`, `canAccessTask`, input parsers.
- `src/lib/domain/task-comments.ts` — comment threads (roots + replies).
- `src/lib/domain/workspace-members.ts` — board member id lists for assignee pickers.
- `src/lib/today-tasks.ts` — inbox due-date grouping.
- `src/lib/prisma.ts` — the singleton client; no raw SQL outside `scripts/` (attachments are the existing exception via `$queryRaw`).
