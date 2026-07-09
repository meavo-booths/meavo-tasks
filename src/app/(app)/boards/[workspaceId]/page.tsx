import { notFound, redirect } from "next/navigation";
import { getAllUsers } from "@/app/actions/workspaces";
import { BoardPageClient } from "@/components/board-page-client";
import { ViewSwitcher } from "@/components/view-switcher";
import { InviteMemberForm } from "@/components/invite-member-form";
import { PageHeader } from "@/components/ui";
import { getTasksUser } from "@/lib/access";
import { getWorkspaceAccess } from "@/lib/domain/task-authz";
import { getWorkspaceBoard } from "@/lib/domain/task-queries";
import { getDefaultColumnId } from "@/lib/domain/workspace-bootstrap";
import { TaskWorkspaceType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const access = await getTasksUser();
  if (!access.ok) redirect("/login");

  const workspaceAccess = await getWorkspaceAccess(
    access.user.id,
    workspaceId,
    access.user.systemRole
  );
  if (!workspaceAccess.canView) notFound();

  const [workspace, users, defaultColumnId] = await Promise.all([
    getWorkspaceBoard(workspaceId),
    getAllUsers(),
    getDefaultColumnId(workspaceId),
  ]);
  if (!workspace) notFound();

  const columns = workspace.columns.map((col) => ({
    id: col.id,
    name: col.name,
    tasks: col.tasks,
  }));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={workspace.name}
          description={
            workspace.type === TaskWorkspaceType.TEAM
              ? workspace.team?.name ?? "Team board"
              : workspace.type === TaskWorkspaceType.SHARED
                ? "Shared board"
                : "Personal board"
          }
        />
        <ViewSwitcher workspaceId={workspaceId} current="board" />
      </div>

      {workspace.type === TaskWorkspaceType.SHARED &&
        workspace.ownerId === access.user.id && (
          <InviteMemberForm workspaceId={workspaceId} members={workspace.members} />
        )}

      <BoardPageClient
        workspaceId={workspaceId}
        columns={columns}
        users={users}
        canEdit={workspaceAccess.canEdit}
        defaultColumnId={defaultColumnId ?? undefined}
      />
    </>
  );
}
