import { redirect } from "next/navigation";
import { getAllUsers } from "@/app/actions/workspaces";
import { InboxDashboard } from "@/components/inbox-dashboard";
import { PageHeader } from "@/components/ui";
import { getTasksUser } from "@/lib/access";
import {
  getBoardDashboardSummaries,
  getPersonalInboxTasks,
  getSharedUpcomingTasks,
} from "@/lib/domain/task-queries";
import { ensurePersonalWorkspace } from "@/lib/domain/workspace-bootstrap";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const access = await getTasksUser();
  if (!access.ok) redirect("/login");

  const workspace = await ensurePersonalWorkspace(access.user.id);
  const [personalTasks, boardSummaries, sharedUpcoming, users] = await Promise.all([
    getPersonalInboxTasks(access.user.id),
    getBoardDashboardSummaries(access.user.id, access.user.systemRole),
    getSharedUpcomingTasks(access.user.id, access.user.systemRole),
    getAllUsers(),
  ]);

  return (
    <>
      <PageHeader
        title="My Inbox"
        description="Your command center — personal tasks, board summaries, and upcoming deadlines."
      />
      <InboxDashboard
        personalWorkspaceId={workspace.id}
        personalTasks={personalTasks}
        boardSummaries={boardSummaries}
        sharedUpcoming={sharedUpcoming}
        users={users}
        personalColumns={workspace.columns.map((col) => ({
          id: col.id,
          name: col.name,
        }))}
      />
    </>
  );
}
