"use client";

import { TaskListRow } from "@/components/task-list-row";
import { Badge } from "@/components/ui";
import { getPriorityHighlight } from "@/lib/board-columns";
import type { BoardDashboardSummary } from "@/lib/domain/task-queries";

export function PriorityHighlightSection({
  boards,
  onTaskClick,
  onToggleComplete,
  hiddenTaskIds,
  pendingTaskIds,
  optimisticTicks,
}: {
  boards: BoardDashboardSummary[];
  onTaskClick: (taskId: string) => void;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => void;
  hiddenTaskIds?: Set<string>;
  pendingTaskIds?: Set<string>;
  optimisticTicks?: Set<string>;
}) {
  const highlight = getPriorityHighlight(boards);
  if (!highlight) return null;

  const visibleItems = highlight.items.filter(
    (item) => !hiddenTaskIds?.has(item.task.id)
  );
  if (visibleItems.length === 0) return null;

  const label = highlight.level === "URGENT" ? "Urgent" : "High priority";
  const tone = highlight.level === "URGENT" ? "danger" : "warning";

  return (
    <section className="mb-5">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{label}</h3>
        <Badge tone={tone}>{visibleItems.length}</Badge>
      </div>
      <div className="space-y-2">
        {visibleItems.map(({ task, boardName, canComplete }) => (
          <TaskListRow
            key={task.id}
            task={task}
            sourceLabel={boardName}
            isCompleted={optimisticTicks?.has(task.id)}
            onClick={() => onTaskClick(task.id)}
            onToggleComplete={
              canComplete && onToggleComplete
                ? () => onToggleComplete(task.id, false)
                : undefined
            }
            pendingComplete={pendingTaskIds?.has(task.id)}
          />
        ))}
      </div>
    </section>
  );
}
