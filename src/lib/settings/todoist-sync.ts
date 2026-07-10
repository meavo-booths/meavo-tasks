import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { createTodoistTask, meavoPriorityToTodoist } from "@/lib/integrations/todoist";
import {
  getTaskIntegration,
  markIntegrationSynced,
  upsertTaskIntegration,
} from "@/lib/settings/task-user-settings";
import { TaskStatus } from "@prisma/client";

type SyncMetadata = {
  pushedTaskIds?: string[];
};

export async function exportTasksToTodoist(userId: string) {
  const integration = await getTaskIntegration(userId, "TODOIST");
  if (!integration?.accessToken) {
    return { error: "Todoist is not connected." };
  }

  const metadata = (integration.metadata ?? {}) as SyncMetadata;
  const alreadyPushed = new Set(metadata.pushedTaskIds ?? []);

  const today = startOfDay(new Date());
  const tasks = await prisma.task.findMany({
    where: {
      status: TaskStatus.OPEN,
      OR: [
        { createdById: userId },
        { assignees: { some: { userId } } },
      ],
    },
    orderBy: [{ dueDate: "asc" }, { title: "asc" }],
    take: 100,
  });

  let pushed = 0;
  const pushedTaskIds = [...alreadyPushed];

  for (const task of tasks) {
    if (alreadyPushed.has(task.id)) continue;

    const dueDate =
      task.dueDate && task.dueDate >= today
        ? task.dueDate.toISOString().slice(0, 10)
        : task.dueDate
          ? task.dueDate.toISOString().slice(0, 10)
          : undefined;

    await createTodoistTask(integration.accessToken, {
      content: task.title,
      description: task.description ?? undefined,
      due_date: dueDate,
      priority: meavoPriorityToTodoist(task.priority),
    });

    pushedTaskIds.push(task.id);
    pushed += 1;
  }

  await upsertTaskIntegration(userId, "TODOIST", {
    accessToken: integration.accessToken,
    metadata: { pushedTaskIds },
  });
  await markIntegrationSynced(userId, "TODOIST");

  return { pushed, skipped: tasks.length - pushed };
}
