import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TaskAttachmentWithUploader = {
  id: string;
  taskId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploadedById: string;
  createdAt: Date;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
};

type AttachmentRow = {
  id: string;
  taskId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploadedById: string;
  createdAt: Date;
  uploadedBy_id: string;
  uploadedBy_name: string | null;
  uploadedBy_email: string;
};

function mapRow(row: AttachmentRow): TaskAttachmentWithUploader {
  return {
    id: row.id,
    taskId: row.taskId,
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    uploadedById: row.uploadedById,
    createdAt: row.createdAt,
    uploadedBy: {
      id: row.uploadedBy_id,
      name: row.uploadedBy_name,
      email: row.uploadedBy_email,
    },
  };
}

export async function getAttachmentsGroupedByTaskId(
  taskIds: string[]
): Promise<Map<string, TaskAttachmentWithUploader[]>> {
  const grouped = new Map<string, TaskAttachmentWithUploader[]>();
  if (taskIds.length === 0) return grouped;

  const rows = await prisma.$queryRaw<AttachmentRow[]>`
    SELECT
      a."id",
      a."taskId",
      a."storageKey",
      a."fileName",
      a."mimeType",
      a."byteSize",
      a."uploadedById",
      a."createdAt",
      u."id" AS "uploadedBy_id",
      u."name" AS "uploadedBy_name",
      u."email" AS "uploadedBy_email"
    FROM "TaskAttachment" a
    INNER JOIN "User" u ON u."id" = a."uploadedById"
    WHERE a."taskId" IN (${Prisma.join(taskIds)})
    ORDER BY a."createdAt" ASC
  `;

  for (const row of rows) {
    const attachment = mapRow(row);
    const existing = grouped.get(attachment.taskId) ?? [];
    existing.push(attachment);
    grouped.set(attachment.taskId, existing);
  }

  return grouped;
}

export async function withTaskAttachments<T extends { id: string }>(
  tasks: T[]
): Promise<Array<T & { attachments: TaskAttachmentWithUploader[] }>> {
  const grouped = await getAttachmentsGroupedByTaskId(tasks.map((task) => task.id));
  return tasks.map((task) => ({
    ...task,
    attachments: grouped.get(task.id) ?? [],
  }));
}

export async function getTaskAttachmentById(attachmentId: string) {
  const rows = await prisma.$queryRaw<AttachmentRow[]>`
    SELECT
      a."id",
      a."taskId",
      a."storageKey",
      a."fileName",
      a."mimeType",
      a."byteSize",
      a."uploadedById",
      a."createdAt",
      u."id" AS "uploadedBy_id",
      u."name" AS "uploadedBy_name",
      u."email" AS "uploadedBy_email"
    FROM "TaskAttachment" a
    INNER JOIN "User" u ON u."id" = a."uploadedById"
    WHERE a."id" = ${attachmentId}
    LIMIT 1
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createTaskAttachmentRecord(input: {
  taskId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  uploadedById: string;
}) {
  const id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "TaskAttachment" (
      "id",
      "taskId",
      "storageKey",
      "fileName",
      "mimeType",
      "byteSize",
      "uploadedById"
    ) VALUES (
      ${id},
      ${input.taskId},
      ${input.storageKey},
      ${input.fileName},
      ${input.mimeType},
      ${input.byteSize},
      ${input.uploadedById}
    )
  `;

  const attachment = await getTaskAttachmentById(id);
  if (!attachment) {
    throw new Error("Failed to create task attachment.");
  }
  return attachment;
}

export async function deleteTaskAttachmentRecord(attachmentId: string) {
  await prisma.$executeRaw`
    DELETE FROM "TaskAttachment"
    WHERE "id" = ${attachmentId}
  `;
}
