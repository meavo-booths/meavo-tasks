import { TaskLinkedApp } from "@prisma/client";
import {
  entityTypeForApp,
  resolveExternalLink,
  type ResolvedLink,
} from "@/lib/integrations/link-resolver";
import { prisma } from "@/lib/prisma";

export function parseLinkedApp(value: string): TaskLinkedApp | null {
  if (Object.values(TaskLinkedApp).includes(value as TaskLinkedApp)) {
    return value as TaskLinkedApp;
  }
  return null;
}

export async function createTaskExternalLink(
  taskId: string,
  linkedApp: TaskLinkedApp,
  entityId: string,
  resolved?: ResolvedLink | null
): Promise<{ error?: string }> {
  const link = resolved ?? (await resolveExternalLink(linkedApp, entityId));
  if (!link) return { error: "Entity not found." };

  await prisma.taskExternalLink.create({
    data: {
      taskId,
      linkedApp,
      entityType: entityTypeForApp(linkedApp),
      entityId,
      displayLabel: link.displayLabel,
      deepLinkUrl: link.deepLinkUrl,
    },
  });

  return {};
}
