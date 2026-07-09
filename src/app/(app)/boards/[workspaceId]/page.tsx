import { notFound, redirect } from "next/navigation";
import {
  getExternalAssigneeCandidates,
  getWorkspaceAssigneeOptions,
  getWorkspaceInviteCandidates,
} from "@/app/actions/workspaces";
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

  const workspace = await getWorkspaceBoard(workspaceId);
  if (!workspace) notFound();

  const showInvite =
    workspace.type === TaskWorkspaceType.SHARED &&
    workspace.ownerId === access.user.id;

  const [defaultColumnId, assigneeOptions, teamInviteCandidates] = await Promise.all([
    getDefaultColumnId(workspaceId),
    getWorkspaceAssigneeOptions(workspaceId),
    showInvite ? getWorkspaceInviteCandidates(workspaceId) : Promise.resolve([]),
  ]);

  const externalCandidateUsers =
    workspace.type === TaskWorkspaceType.SHARED && workspaceAccess.canEdit
      ? await getExternalAssigneeCandidates(workspaceId)
      : [];

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
        <div className="flex items-center gap-2">
          {showInvite && (
            <InviteMemberForm
              workspaceId={workspaceId}
              members={workspace.members}
              teamCandidates={teamInviteCandidates}
            />
          )}
          <ViewSwitcher workspaceId={workspaceId} current="board" />
        </div>
      </div>

      <BoardPageClient
        workspaceId={workspaceId}
        workspaceType={workspace.type}
        columns={columns}
        users={assigneeOptions}
        canEdit={workspaceAccess.canEdit}
        defaultColumnId={defaultColumnId ?? undefined}
        assigneeOptions={assigneeOptions}
        externalCandidateUsers={externalCandidateUsers}
        currentUserId={access.user.id}
      />
    </>
  );
}
