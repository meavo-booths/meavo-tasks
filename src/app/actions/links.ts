"use server";

import { revalidatePath } from "next/cache";
import { getTasksUser } from "@/lib/access";
import { requireWorkspaceEdit } from "@/lib/domain/task-authz";
import { getTaskById } from "@/lib/domain/task-queries";
import {
  createTaskExternalLink,
  parseLinkedApp,
} from "@/lib/integrations/external-link";
import { searchLinkableEntities } from "@/lib/integrations/link-resolver";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error?: string };

export async function attachExternalLink(formData: FormData): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const taskId = (formData.get("taskId") as string)?.trim();
  const linkedApp = parseLinkedApp((formData.get("linkedApp") as string)?.trim());
  const entityId = (formData.get("entityId") as string)?.trim();

  if (!taskId || !linkedApp || !entityId) {
    return { error: "Task, app, and entity are required." };
  }

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      access.user.id,
      task.workspaceId,
      access.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to link this task." };
  }

  const linkResult = await createTaskExternalLink(taskId, linkedApp, entityId);
  if (linkResult.error) return { error: linkResult.error };

  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath("/");
  return {};
}

export async function detachExternalLink(linkId: string): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const link = await prisma.taskExternalLink.findUnique({
    where: { id: linkId },
    include: { task: { select: { workspaceId: true } } },
  });
  if (!link) return { error: "Link not found." };

  try {
    await requireWorkspaceEdit(
      access.user.id,
      link.task.workspaceId,
      access.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to remove this link." };
  }

  await prisma.taskExternalLink.delete({ where: { id: linkId } });

  revalidatePath(`/boards/${link.task.workspaceId}`);
  revalidatePath("/");
  return {};
}

export async function searchEntities(linkedApp: string, query: string) {
  const access = await getTasksUser();
  if (!access.ok) return [];

  const app = parseLinkedApp(linkedApp);
  if (!app) return [];

  return searchLinkableEntities(app, query);
}
