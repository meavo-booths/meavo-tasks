import { PriorityBadge } from "@/components/priority-badge";
import { DueDateBadge } from "@/components/due-date-badge";
import { AvatarStack } from "@/components/user-avatar";
import { PRIORITY_COLORS } from "@/lib/dates";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

export function TaskListRow({
  task,
  onClick,
  showColumn,
}: {
  task: TaskWithRelations;
  onClick?: () => void;
  showColumn?: boolean;
}) {
  if (!task) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl border border-slate-200/80 border-l-4 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-card ${PRIORITY_COLORS[task.priority]}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition group-hover:border-brand-400" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-900">{task.title}</p>
          <PriorityBadge priority={task.priority} />
          {showColumn && task.column && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {task.column.name}
            </span>
          )}
        </div>
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{task.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {task.dueDate && <DueDateBadge dueDate={task.dueDate} compact />}
        <AvatarStack
          users={task.assignees.map((a) => ({
            userId: a.userId,
            name: a.user.name,
            email: a.user.email,
          }))}
        />
      </div>
    </button>
  );
}
