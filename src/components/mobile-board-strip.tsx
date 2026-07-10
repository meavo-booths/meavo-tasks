"use client";

import { TaskCard } from "@/components/task-card";
import { Badge } from "@/components/ui";
import { groupTasksByColumn } from "@/lib/board-columns";
import type { BoardDashboardSummary } from "@/lib/domain/task-queries";

const COLUMN_ACCENTS: Record<string, string> = {
  Backlog: "bg-slate-400",
  "To Do": "bg-sky-400",
  "In Progress": "bg-amber-400",
  Done: "bg-emerald-400",
};

export function MobileBoardStrip({
  board,
  onTaskClick,
}: {
  board: BoardDashboardSummary;
  onTaskClick: (taskId: string) => void;
}) {
  const columns = groupTasksByColumn(board.columns, board.tasks);

  return (
    <div className="mobile-board-strip">
      {columns.map((column) => {
        const accent = COLUMN_ACCENTS[column.name] ?? "bg-brand-500";
        return (
          <div key={column.id} className="mobile-board-strip__column">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${accent}`} />
              <h4 className="text-xs font-semibold text-slate-800">{column.name}</h4>
              <Badge tone="neutral">{column.tasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                  mobile
                />
              ))}
              {column.tasks.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">
                  No tasks
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
