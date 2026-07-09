import { redirect } from "next/navigation";
import { getTasksUser } from "@/lib/access";
import { getAllUsers } from "@/app/actions/workspaces";
import { QuickAddTask } from "@/components/quick-add-task";
import { TaskListView } from "@/components/task-list-view";
import { Card, PageHeader } from "@/components/ui";
import { getPersonalInboxTasks } from "@/lib/domain/task-queries";
import { ensurePersonalWorkspace } from "@/lib/domain/workspace-bootstrap";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const access = await getTasksUser();
  if (!access.ok) redirect("/login");

  const workspace = await ensurePersonalWorkspace(access.user.id);
  const [tasks, users] = await Promise.all([
    getPersonalInboxTasks(access.user.id),
    getAllUsers(),
  ]);

  return (
    <>
      <PageHeader
        title="My Inbox"
        description="Personal tasks grouped by due date."
      />
      <Card className="mb-6">
        <QuickAddTask workspaceId={workspace.id} />
      </Card>
      <TaskListView
        tasks={tasks}
        columns={workspace.columns}
        users={users}
        canEdit
      />
    </>
  );
}
