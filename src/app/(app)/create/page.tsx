import { TaskLinkedApp } from "@prisma/client";
import { notFound } from "next/navigation";
import { getWorkspaceAssigneeOptions } from "@/app/actions/workspaces";
import { CreateLinkedTaskForm } from "@/components/create-linked-task-form";
import { Card, PageHeader } from "@/components/ui";
import { getTasksUser } from "@/lib/access";
import { parseCreateTaskParams } from "@/lib/create-task-url";
import { ensurePersonalWorkspace } from "@/lib/domain/workspace-bootstrap";
import { resolveExternalLink } from "@/lib/integrations/link-resolver";
import { formatLinkedEntityDescription } from "@/lib/integrations/linked-description";
import { LINKED_APP_OPTIONS } from "@/lib/tasks-config";

export const dynamic = "force-dynamic";

export default async function CreateTaskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getTasksUser();
  if (!access.ok) notFound();

  const params = parseCreateTaskParams(await searchParams);
  if (!params) notFound();

  const resolved = await resolveExternalLink(
    params.linkedApp as TaskLinkedApp,
    params.entityId
  );
  if (!resolved) notFound();

  const workspace = await ensurePersonalWorkspace(access.user.id);
  const assigneeOptions = await getWorkspaceAssigneeOptions(workspace.id);
  const appLabel =
    LINKED_APP_OPTIONS.find((option) => option.value === params.linkedApp)?.label ??
    params.linkedApp;
  const defaultDescription = formatLinkedEntityDescription(
    resolved,
    params.linkedApp as TaskLinkedApp
  );

  return (
    <>
      <PageHeader
        title="Add task"
        description={`Create a task linked to ${appLabel.toLowerCase()}.`}
      />
      <Card className="max-w-2xl">
        <CreateLinkedTaskForm
          workspaceId={workspace.id}
          linkedApp={params.linkedApp}
          entityId={params.entityId}
          defaultTitle={params.title}
          defaultDescription={defaultDescription}
          entityLabel={resolved.displayLabel}
          assigneeOptions={assigneeOptions}
          currentUserId={access.user.id}
        />
      </Card>
    </>
  );
}
