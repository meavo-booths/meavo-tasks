import { isBefore, isSameDay, startOfDay } from "date-fns";
import type { BoardDashboardSummary, TaskWithRelations } from "@/lib/domain/task-queries";
import { TaskWorkspaceType } from "@prisma/client";

export type TodayTaskItem = {
  task: TaskWithRelations;
  sourceLabel: string;
  canComplete: boolean;
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

  function add(task: TaskWithRelations, sourceLabel: string, canComplete: boolean) {
    if (!task?.dueDate || !isDueTodayOrOverdue(task.dueDate) || seen.has(task.id)) return;
    seen.add(task.id);
    items.push({ task, sourceLabel, canComplete });
  }

  for (const task of personalTasks) {
    add(task, "Personal", true);
  }

  for (const board of boardSummaries) {
    for (const task of board.tasks) {
      const assigned = task.assignees.some((a) => a.userId === currentUserId);
      if (assigned) add(task, board.name, board.canEdit);
    }
  }

  for (const task of sharedUpcoming) {
    const board = boardSummaries.find((b) => b.id === task.workspaceId);
    add(task, task.workspace.name, board?.canEdit ?? false);
  }

  for (const task of externalShared) {
    add(task, `${task.workspace.name} · shared`, false);
  }

  return items;
}
