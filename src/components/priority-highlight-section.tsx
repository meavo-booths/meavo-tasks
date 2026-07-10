"use client";

import { TaskListRow } from "@/components/task-list-row";
import { Badge } from "@/components/ui";
import { getPriorityHighlight } from "@/lib/board-columns";
import type { BoardDashboardSummary } from "@/lib/domain/task-queries";

export function PriorityHighlightSection({
  boards,
  onTaskClick,
}: {
  boards: BoardDashboardSummary[];
  onTaskClick: (taskId: string) => void;
}) {
  const highlight = getPriorityHighlight(boards);
  if (!highlight) return null;

  const label = highlight.level === "URGENT" ? "Urgent" : "High priority";
  const tone = highlight.level === "URGENT" ? "danger" : "warning";

  return (
    <section className="mb-5">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{label}</h3>
        <Badge tone={tone}>{highlight.items.length}</Badge>
      </div>
      <div className="space-y-2">
        {highlight.items.map(({ task, boardName }) => (
          <TaskListRow
            key={task.id}
            task={task}
            sourceLabel={boardName}
            onClick={() => onTaskClick(task.id)}
          />
        ))}
      </div>
    </section>
  );
}
