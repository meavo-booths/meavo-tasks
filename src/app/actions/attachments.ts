"use server";

import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { getTasksUser } from "@/lib/access";
import { getTaskAccess } from "@/lib/domain/task-authz";
import { getTaskById } from "@/lib/domain/task-queries";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error?: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function revalidateTaskPaths(workspaceId: string) {
  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${workspaceId}`);
  revalidatePath(`/boards/${workspaceId}/list`);
}

export async function uploadTaskAttachment(formData: FormData): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const taskId = (formData.get("taskId") as string)?.trim();
  const file = formData.get("file");

  if (!taskId || !(file instanceof File)) {
    return { error: "A file is required." };
  }

  if (file.size === 0) {
    return { error: "The file is empty." };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { error: "File must be 10 MB or smaller." };
  }

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  const taskAccess = await getTaskAccess(
    access.user.id,
    taskId,
    access.user.systemRole
  );
  if (!taskAccess.canEdit) {
    return { error: "You do not have permission to attach files to this task." };
  }

  const blob = await put(
    `tasks/${task.workspaceId}/${taskId}/${Date.now()}-${file.name}`,
    file,
    {
      access: "private",
      addRandomSuffix: true,
    }
  );

  await prisma.taskAttachment.create({
    data: {
      taskId,
      storageKey: blob.pathname,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      byteSize: file.size,
      uploadedById: access.user.id,
    },
  });

  revalidateTaskPaths(task.workspaceId);
  return {};
}

export async function deleteTaskAttachment(attachmentId: string): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const attachment = await prisma.taskAttachment.findUnique({
    where: { id: attachmentId },
    include: { task: { select: { id: true, workspaceId: true } } },
  });
  if (!attachment) return { error: "Attachment not found." };

  const taskAccess = await getTaskAccess(
    access.user.id,
    attachment.task.id,
    access.user.systemRole
  );
  if (!taskAccess.canEdit) {
    return { error: "You do not have permission to remove this attachment." };
  }

  try {
    await del(attachment.storageKey);
  } catch {
    // Blob may already be gone; still remove DB row.
  }

  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  revalidateTaskPaths(attachment.task.workspaceId);
  return {};
}
