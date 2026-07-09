import { notFound, redirect } from "next/navigation";
import {
  getExternalAssigneeCandidates,
  getWorkspaceAssigneeOptions,
  getWorkspaceInviteCandidates,
} from "@/app/actions/workspaces";
import { InviteMemberForm } from "@/components/invite-member-form";
import { QuickAddTask } from "@/components/quick-add-task";
import { TaskListView } from "@/components/task-list-view";
import { ViewSwitcher } from "@/components/view-switcher";
import { Card, PageHeader } from "@/components/ui";
import { getTasksUser } from "@/lib/access";
import { getWorkspaceAccess } from "@/lib/domain/task-authz";
import { getWorkspaceOpenTasks } from "@/lib/domain/task-queries";
import { prisma } from "@/lib/prisma";
import { TaskWorkspaceType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function BoardListPage({
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

  const [workspace, tasks, assigneeOptions] = await Promise.all([
    prisma.taskWorkspace.findUnique({
      where: { id: workspaceId },
      include: {
        columns: { orderBy: { position: "asc" } },
        team: { select: { name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    getWorkspaceOpenTasks(workspaceId),
    getWorkspaceAssigneeOptions(workspaceId),
  ]);
  if (!workspace) notFound();

  const showInvite =
    workspace.type === TaskWorkspaceType.SHARED &&
    workspace.ownerId === access.user.id;

  const teamInviteCandidates = showInvite
    ? await getWorkspaceInviteCandidates(workspaceId)
    : [];

  const externalCandidateUsers =
    workspace.type === TaskWorkspaceType.SHARED && workspaceAccess.canEdit
      ? await getExternalAssigneeCandidates(workspaceId)
      : [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={workspace.name}
          description={
            workspace.type === TaskWorkspaceType.TEAM
              ? workspace.team?.name ?? "Team board"
              : "List view"
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
          <ViewSwitcher workspaceId={workspaceId} current="list" />
        </div>
      </div>

      {workspaceAccess.canEdit && (
        <Card className="mb-6">
          <QuickAddTask
            workspaceId={workspaceId}
            assigneeOptions={assigneeOptions}
            currentUserId={access.user.id}
          />
        </Card>
      )}

      <TaskListView
        tasks={tasks}
        columns={workspace.columns}
        users={assigneeOptions}
        canEdit={workspaceAccess.canEdit}
        workspaceType={workspace.type}
        boardMemberUsers={assigneeOptions}
        externalCandidateUsers={externalCandidateUsers}
        currentUserId={access.user.id}
      />
    </>
  );
}
