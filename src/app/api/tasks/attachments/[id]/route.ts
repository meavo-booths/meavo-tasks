import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getTasksUser } from "@/lib/access";
import { canAccessTask } from "@/lib/domain/task-queries";
import { sanitizeFilename } from "@/lib/content-disposition";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getTasksUser();
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const attachment = await prisma.taskAttachment.findUnique({
    where: { id },
    select: {
      fileName: true,
      mimeType: true,
      storageKey: true,
      taskId: true,
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await canAccessTask(
    access.user.id,
    attachment.taskId,
    access.user.systemRole
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await get(attachment.storageKey, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": attachment.mimeType || result.blob.contentType,
      "Content-Disposition": `inline; filename="${sanitizeFilename(attachment.fileName, "attachment")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
