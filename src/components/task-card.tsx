import { format } from "date-fns";
import { Badge } from "@/components/ui";
import { PRIORITY_DOT_COLORS } from "@/lib/dates";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

export function TaskCard({
  task,
  onClick,
  draggable,
  onDragStart,
}: {
  task: TaskWithRelations;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  if (!task) return null;

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT_COLORS[task.priority]}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{task.title}</p>
          {task.dueDate && (
            <p className="mt-1 text-xs text-slate-500">
              Due {format(task.dueDate, "MMM d")}
            </p>
          )}
          {task.assignees.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.assignees.slice(0, 3).map((a) => (
                <Badge key={a.userId} tone="neutral">
                  {(a.user.name ?? a.user.email ?? "?").split(" ")[0]}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
