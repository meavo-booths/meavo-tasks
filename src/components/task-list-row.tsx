import { format } from "date-fns";
import { Badge } from "@/components/ui";
import { PRIORITY_COLORS } from "@/lib/dates";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

export function TaskListRow({
  task,
  onClick,
}: {
  task: TaskWithRelations;
  onClick?: () => void;
}) {
  if (!task) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border border-slate-200 border-l-4 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-slate-50 ${PRIORITY_COLORS[task.priority]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{task.title}</p>
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{task.description}</p>
        )}
      </div>
      {task.dueDate && (
        <span className="shrink-0 text-xs text-slate-500">
          {format(task.dueDate, "MMM d")}
        </span>
      )}
      {task.assignees.length > 0 && (
        <div className="hidden shrink-0 gap-1 sm:flex">
          {task.assignees.slice(0, 2).map((a) => (
            <Badge key={a.userId} tone="neutral">
              {(a.user.name ?? a.user.email ?? "?").split(" ")[0]}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}
