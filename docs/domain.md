# Domain reference — meavo-tasks

Business rules and **where to change what**. For stack see [architecture.md](architecture.md). For tables see [data-model.md](data-model.md).

## Glossary

| Term | Meaning |
|------|---------|
| Workspace | A task container (`TaskWorkspace`) — one of three types below; "board" in the UI |
| Personal workspace | `type = PERSONAL`, auto-created per user (`ensurePersonalWorkspace`); backs **My Inbox**; never shared |
| Team board | `type = TEAM`, tied to a gateway `Team` — every team member can view and edit |
| Shared board | `type = SHARED`, explicit member list with per-member `VIEWER` / `EDITOR` role |
| Column | `TaskBoardColumn` — kanban column; defaults `Backlog / To Do / In Progress / Done` |
| Assignee | `TaskAssignee` — `MEMBER` scope (board member) or `EXTERNAL` (task-only viewer) |
| Comment | `TaskComment` — timestamped discussion on a task; one-level threads (`parentId` → root only); roots can be resolved |
| External link | `TaskExternalLink` — deep link to an entity in another Meavo app (deal, batch, RP request, assembly) |
| Inbox | The `/` page: the viewer's tasks grouped Overdue / Today / Upcoming / No date (`src/lib/today-tasks.ts`) |

## Status / state values

- `TaskStatus`: `OPEN` → `COMPLETED` (sets `completedAt`) → can be reopened to `OPEN`; `CANCELLED` exists in the enum but has no UI flow.
- `TaskPriority`: `NONE | LOW | MEDIUM | HIGH | URGENT` — labels/colors centralized in `PRIORITY_META` (`src/lib/tasks-config.ts`).
- `TaskWorkspaceType`: `PERSONAL | TEAM | SHARED`. `TaskWorkspaceRole`: `VIEWER | EDITOR` (shared boards only).
- `TaskAssigneeScope`: `MEMBER | EXTERNAL`.

## Roles / personas

Resolved in `src/lib/access.ts` (app gate) and `src/lib/domain/task-authz.ts` (per-board/task):

| Role | Scope | Permissions |
|------|-------|-------------|
| `systemRole = ADMIN` (gateway) | Whole app | Bypasses tool-card check; owner-level access to every workspace |
| Workspace owner | Their workspace | View + edit; personal workspaces are invisible to everyone else |
| Team member | `TEAM` boards of their gateway teams | View + edit (via `TeamMember` lookup) |
| Shared-board `EDITOR` | That board | View + edit |
| Shared-board `VIEWER` | That board | View only (may still comment — see below) |
| `EXTERNAL` assignee | Single task | View that task only, never edit fields (`isExternalOnly`); may comment/reply |

## Mutation map

All mutations are Server Actions; every one starts with `getTasksUser()` and returns `{ error?: string }`.

| Change | Domain module | Action | Notes |
|--------|---------------|--------|-------|
| Create/update/complete/reopen/delete task | `task-authz.ts`, `task-queries.ts` | `src/app/actions/tasks.ts` | `requireWorkspaceEdit` (create) / `requireTaskEdit`; `parseOptionalDate`, `parsePriority` for input |
| Drag-and-drop / move task | `task-authz.ts` | `moveTask` in `tasks.ts` | Updates `columnId` + `position` |
| Assign members / external assignees | `workspace-members.ts` | `setTaskMemberAssignees`, `setTaskExternalAssignees` in `tasks.ts` | External assignees get task-only view access |
| Create team / shared board | `workspace-bootstrap.ts` | `src/app/actions/workspaces.ts` | Team boards verify `TeamMember`; columns seeded from `DEFAULT_COLUMNS` |
| Invite / remove board member | `task-authz.ts` | `inviteWorkspaceMember`, `removeWorkspaceMember` in `workspaces.ts` | Shared boards only |
| Attach/detach cross-tool link | — | `src/app/actions/links.ts` | Labels + URLs resolved by `src/lib/integrations/link-resolver.ts` (read-only queries on other apps' tables) |
| Comment / reply / resolve / delete | `task-comments.ts` | `src/app/actions/comments.ts` | Anyone with `canView` may post/reply; resolve root = `canEdit` or root author; delete = author or `canEdit`; one-level threads only |
| Slack / Todoist settings | `src/lib/settings/task-user-settings.ts` | `src/app/actions/settings.ts` | Todoist export via `src/lib/settings/todoist-sync.ts` |
| Login / logout | `src/lib/login-throttle.ts` | `src/app/actions/auth.ts` | Credentials throttled per email |

## Authorization

- Resolved in: `src/lib/access.ts` (tool card, admin bypass) → `src/lib/domain/task-authz.ts` (`getWorkspaceAccess`, `getTaskAccess`, `require*` helpers).
- Rules agents get wrong without docs:
  - The app gate alone is not enough — every mutation must also pass a `task-authz` check for the specific workspace/task.
  - `EXTERNAL` assignees can *view* a task without any workspace access; never grant them field-edit paths. They **may** comment and reply (`canView`).
  - Comment resolve/unresolve is allowed for task editors **or** the root comment’s author; nested replies-to-replies are rejected.
  - Personal workspaces are strictly private — no invite or membership path may target `type = PERSONAL`.
  - The login-throttle key prefix is literally `hols-login:` (inherited from the hols app) — shared `LoginThrottle` table, so don't "fix" the prefix casually.
