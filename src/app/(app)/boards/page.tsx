import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserTeams } from "@/app/actions/workspaces";
import { CreateBoardForms } from "@/components/create-board-forms";
import { getTasksUser } from "@/lib/access";
import { getAccessibleWorkspaces } from "@/lib/domain/task-queries";
import { Badge, Card, PageHeader } from "@/components/ui";
import { TaskWorkspaceType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const access = await getTasksUser();
  if (!access.ok) redirect("/login");

  const [workspaces, teamMemberships] = await Promise.all([
    getAccessibleWorkspaces(access.user.id, access.user.systemRole),
    getUserTeams(),
  ]);

  const teamsWithoutBoard = teamMemberships.filter(
    (m) => m.team.taskWorkspaces.length === 0
  );

  return (
    <>
      <PageHeader
        title="Boards"
        description="Team and shared workspaces."
      />

      <CreateBoardForms teamsWithoutBoard={teamsWithoutBoard} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <Link key={workspace.id} href={`/boards/${workspace.id}`}>
            <Card className="transition hover:border-brand-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{workspace.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {workspace.type === TaskWorkspaceType.PERSONAL && "Personal"}
                    {workspace.type === TaskWorkspaceType.TEAM &&
                      (workspace.team?.name ?? "Team")}
                    {workspace.type === TaskWorkspaceType.SHARED && "Shared"}
                  </p>
                </div>
                <Badge tone="neutral">{workspace._count.tasks} open</Badge>
              </div>
              {workspace.team?.color && (
                <div
                  className="mt-3 h-1 rounded-full"
                  style={{ backgroundColor: workspace.team.color }}
                />
              )}
            </Card>
          </Link>
        ))}
      </div>

      {workspaces.length === 0 && (
        <p className="text-sm text-slate-500">No boards yet. Create one above.</p>
      )}
    </>
  );
}
