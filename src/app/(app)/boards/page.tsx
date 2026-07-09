import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserTeams } from "@/app/actions/workspaces";
import { CreateBoardForms } from "@/components/create-board-forms";
import { IconBoard, IconChevronRight } from "@/components/icons";
import { getTasksUser } from "@/lib/access";
import { getAccessibleWorkspaces } from "@/lib/domain/task-queries";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { TaskWorkspaceType } from "@prisma/client";

export const dynamic = "force-dynamic";

function boardTypeLabel(type: TaskWorkspaceType, teamName: string | null) {
  if (type === TaskWorkspaceType.PERSONAL) return "Personal";
  if (type === TaskWorkspaceType.TEAM) return teamName ?? "Team";
  return "Shared";
}

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

  const visibleBoards = workspaces.filter((w) => w.type !== TaskWorkspaceType.PERSONAL);

  return (
    <>
      <PageHeader
        title="Boards"
        description="Team and shared workspaces for collaborative task management."
      />

      <CreateBoardForms teamsWithoutBoard={teamsWithoutBoard} />

      {visibleBoards.length === 0 ? (
        <EmptyState
          icon={<IconBoard size={28} />}
          title="No boards yet"
          description="Create a team or shared board above to collaborate with others."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleBoards.map((workspace) => (
            <Link key={workspace.id} href={`/boards/${workspace.id}`} className="group">
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
                      {workspace.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {boardTypeLabel(workspace.type, workspace.team?.name ?? null)}
                    </p>
                  </div>
                  <span className="text-slate-300 transition group-hover:text-brand-500">
                    <IconChevronRight size={18} />
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge tone={workspace._count.tasks > 0 ? "brand" : "neutral"}>
                    {workspace._count.tasks} open
                  </Badge>
                  {workspace.team?.color && (
                    <div
                      className="h-1.5 w-16 rounded-full"
                      style={{ backgroundColor: workspace.team.color }}
                    />
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
