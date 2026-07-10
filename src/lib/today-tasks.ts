import { isBefore, isSameDay, startOfDay } from "date-fns";
import type { BoardDashboardSummary, TaskWithRelations } from "@/lib/domain/task-queries";
import { TaskWorkspaceType } from "@prisma/client";

export type TodayTaskItem = {
  task: TaskWithRelations;
  sourceLabel: string;
};

type SharedTask = TaskWithRelations & {
  workspace: { id: string; name: string; type: TaskWorkspaceType };
};

function isDueTodayOrOverdue(dueDate: Date) {
  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  return isBefore(due, today) || isSameDay(due, today);
}

export function buildTodayTaskItems({
  personalTasks,
  boardSummaries,
  sharedUpcoming,
  externalShared,
  currentUserId,
}: {
  personalTasks: TaskWithRelations[];
  boardSummaries: BoardDashboardSummary[];
  sharedUpcoming: SharedTask[];
  externalShared: SharedTask[];
  currentUserId: string;
}): TodayTaskItem[] {
  const items: TodayTaskItem[] = [];
  const seen = new Set<string>();

  function add(task: TaskWithRelations, sourceLabel: string) {
    if (!task?.dueDate || !isDueTodayOrOverdue(task.dueDate) || seen.has(task.id)) return;
    seen.add(task.id);
    items.push({ task, sourceLabel });
  }

  for (const task of personalTasks) {
    add(task, "Personal");
  }

  for (const board of boardSummaries) {
    for (const task of board.tasks) {
      const assigned = task.assignees.some((a) => a.userId === currentUserId);
      if (assigned) add(task, board.name);
    }
  }

  for (const task of sharedUpcoming) {
    add(task, task.workspace.name);
  }

  for (const task of externalShared) {
    add(task, `${task.workspace.name} · shared`);
  }

  return items;
}
