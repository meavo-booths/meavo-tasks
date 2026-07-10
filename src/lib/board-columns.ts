import type { TaskWithRelations } from "@/lib/domain/task-queries";

const COLUMN_ORDER = ["In Progress", "To Do", "Backlog", "Done"];

export function orderBoardColumns<T extends { id: string; name: string }>(columns: T[]): T[] {
  return [...columns].sort((a, b) => {
    const ai = COLUMN_ORDER.indexOf(a.name);
    const bi = COLUMN_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function groupTasksByColumn(
  columns: { id: string; name: string }[],
  tasks: TaskWithRelations[]
) {
  return orderBoardColumns(columns).map((column) => ({
    ...column,
    tasks: tasks.filter(
      (task) => task.columnId === column.id || task.column?.id === column.id
    ),
  }));
}

export type PriorityHighlightItem = {
  task: TaskWithRelations;
  boardName: string;
};

export function getPriorityHighlight(
  boards: { name: string; tasks: TaskWithRelations[] }[]
): { level: "URGENT" | "HIGH"; items: PriorityHighlightItem[] } | null {
  const all: PriorityHighlightItem[] = boards.flatMap((board) =>
    board.tasks.map((task) => ({ task, boardName: board.name }))
  );

  const urgent = all.filter((item) => item.task.priority === "URGENT");
  if (urgent.length > 0) return { level: "URGENT", items: urgent };

  const high = all.filter((item) => item.task.priority === "HIGH");
  if (high.length > 0) return { level: "HIGH", items: high };

  return null;
}
