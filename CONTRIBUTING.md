# Contributing — meavo-tasks

## Before you open a PR

- [ ] Changes are scoped to the request — no drive-by refactors
- [ ] `npm run lint` passes
- [ ] No test suite — document the manual check you did (page + viewport)
- [ ] New pages verified at 375px and 1280px widths
- [ ] Agent docs updated if you added routes, domain modules, crons, or auth rules
- [ ] `revalidatePath()` called for every route affected by a write

## Branch naming

`feature/short-description`, `fix/short-description`, `docs/short-description`

## Commit messages

Imperative mood, complete sentences: "Add external assignee scope to task modal".

## Code placement

| Layer | Location |
|-------|----------|
| Pages / UI | `src/app/(app)/`, `src/components/` |
| Mutations | `src/app/actions/` (Server Actions) |
| Business logic / authz | `src/lib/domain/` |
| Integrations | `src/lib/integrations/`, `src/lib/settings/` |

## Cross-repo dependencies

Bump `@meavo/db` or `@meavo/navigation` by changing the git tag in `package.json` (e.g. `github:meavo-booths/meavo-db#v0.11.2`), then `npm install` and commit the lockfile. Coordinate `@meavo/db` bumps with the other satellite apps.

## Schema changes

Only in **meavo-db** — edit schema there, tag a release, bump the ref here, `npm install` + `npx prisma generate`. If the change adds task tables/columns, also add an idempotent SQL copy in `scripts/` and wire it into `scripts/bootstrap-db.mjs`. Never `prisma db push` from this repo.

## PR description

Include:

1. **What** changed (user-visible or API behaviour)
2. **Why** (link issue if any)
3. **How to verify** (commands or manual steps)
4. **Out of scope** (what you intentionally did not change)

## Agent-assisted PRs

If an AI agent wrote the code:

- Verify paths and business rules against `docs/domain.md`
- Reject leftover template placeholder comments in merged files
- Ensure no secrets in diff
