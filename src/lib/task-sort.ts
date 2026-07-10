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
