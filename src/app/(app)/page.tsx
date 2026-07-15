import { redirect } from "next/navigation";
import {
  getAllUsers,
  getExternalAssigneeCandidates,
  getUserTeams,
  getWorkspaceAssigneeOptions,
} from "@/app/actions/workspaces";
import { InboxDashboard } from "@/components/inbox-dashboard";
import { PageHeader } from "@/components/ui";
import { getTasksUser } from "@/lib/access";
import {
  getBoardDashboardSummaries,
  getExternallySharedTasks,
  getPersonalCompletedTasks,
  getPersonalInboxTasks,
  getSharedUpcomingTasks,
} from "@/lib/domain/task-queries";
import { ensurePersonalWorkspace } from "@/lib/domain/workspace-bootstrap";
import { TaskWorkspaceType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const { task: initialTaskId } = await searchParams;
  const access = await getTasksUser();
  if (!access.ok) redirect("/login");

  const workspace = await ensurePersonalWorkspace(access.user.id);
  const [personalTasks, completedPersonalTasks, boardSummaries, sharedUpcoming, externalShared, users, teamMemberships] =
    await Promise.all([
      getPersonalInboxTasks(access.user.id),
      getPersonalCompletedTasks(access.user.id),
      getBoardDashboardSummaries(access.user.id, access.user.systemRole),
      getSharedUpcomingTasks(access.user.id, access.user.systemRole),
      getExternallySharedTasks(access.user.id),
      getAllUsers(),
      getUserTeams(),
    ]);

  const teamsWithoutBoard = teamMemberships.filter(
    (m) => m.team.taskWorkspaces.length === 0
  );

  const boardAssigneeEntries = await Promise.all(
    boardSummaries.map(async (board) => {
      const members = await getWorkspaceAssigneeOptions(board.id);
      const external =
        board.type === TaskWorkspaceType.SHARED
          ? await getExternalAssigneeCandidates(board.id)
          : [];
      return [board.id, { members, external }] as const;
    })
  );
  const boardAssigneeOptions = Object.fromEntries(boardAssigneeEntries);

  return (
    <>
      <div className="hidden md:block">
        <PageHeader title="Dashboard" />
      </div>
      <InboxDashboard
        personalWorkspaceId={workspace.id}
        personalTasks={personalTasks}
        completedPersonalTasks={completedPersonalTasks}
        boardSummaries={boardSummaries}
        sharedUpcoming={sharedUpcoming}
        externalShared={externalShared}
        users={users}
        personalColumns={workspace.columns.map((col) => ({
          id: col.id,
          name: col.name,
        }))}
        currentUserId={access.user.id}
        teamsWithoutBoard={teamsWithoutBoard}
        boardAssigneeOptions={boardAssigneeOptions}
        initialTaskId={initialTaskId}
      />
    </>
  );
}
