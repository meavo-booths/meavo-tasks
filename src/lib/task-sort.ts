import { isBefore, isSameDay, startOfDay } from "date-fns";
import { TaskPriority } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

const COLUMN_RANK: Record<string, number> = {
  "In Progress": 0,
  "To Do": 1,
  Done: 3,
  Backlog: 4,
};

function columnRank(name: string | undefined | null) {
  if (!name) return 2;
  return COLUMN_RANK[name] ?? 2;
}

function dueRank(task: TaskWithRelations) {
  if (!task.dueDate) return Number.MAX_SAFE_INTEGER;
  return task.dueDate.getTime();
}

function dueGroupRank(task: TaskWithRelations) {
  if (!task.dueDate) return 3;
  const today = startOfDay(new Date());
  const due = startOfDay(task.dueDate);
  if (isBefore(due, today)) return 0;
  if (isSameDay(due, today)) return 1;
  return 2;
}

/** Personal task ordering: overdue and soonest deadlines first, then priority. */
export function sortTasksByDeadlineAndUrgency<T extends TaskWithRelations>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const groupDiff = dueGroupRank(a) - dueGroupRank(b);
    if (groupDiff !== 0) return groupDiff;

    const dueDiff = dueRank(a) - dueRank(b);
    if (dueDiff !== 0) return dueDiff;

    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return a.title.localeCompare(b.title);
  });
}

/** Sort board preview tasks: in-progress first, backlog last; urgent before low within each group. */
export function sortTasksForPreview(tasks: TaskWithRelations[]) {
  return [...tasks].sort((a, b) => {
    const columnDiff = columnRank(a.column?.name) - columnRank(b.column?.name);
    if (columnDiff !== 0) return columnDiff;

    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return dueRank(a) - dueRank(b);
  });
}

export function groupTasksByColumns(
  columns: { id: string; name: string }[],
  tasks: TaskWithRelations[]
) {
  return columns.map((column) => ({
    ...column,
    tasks: tasks
      .filter((task) => task.columnId === column.id)
      .sort((a, b) => a.position - b.position),
  }));
}
