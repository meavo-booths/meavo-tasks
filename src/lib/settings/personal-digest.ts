import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

export async function getUserDigestTasks(userId: string) {
  const today = startOfDay(new Date());

  return prisma.task.findMany({
    where: {
      status: TaskStatus.OPEN,
      dueDate: { lte: today },
      OR: [
        { createdById: userId },
        { assignees: { some: { userId } } },
      ],
    },
    include: {
      workspace: { select: { name: true, type: true } },
    },
    orderBy: [{ dueDate: "asc" }, { title: "asc" }],
    take: 30,
  });
}
