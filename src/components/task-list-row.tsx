import { PriorityBadge } from "@/components/priority-badge";
import { DueDateBadge } from "@/components/due-date-badge";
import { TaskAssigneeAvatars } from "@/components/task-assignee-avatars";
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
      className={`group flex w-full flex-col gap-2 rounded-xl border border-slate-200/80 border-l-4 bg-white px-3 py-3 text-left shadow-sm transition active:scale-[0.99] active:bg-slate-50 hover:border-slate-300 hover:shadow-card sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:active:scale-100 sm:active:bg-white ${PRIORITY_COLORS[task.priority]}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition group-hover:border-brand-400 sm:mt-0" />

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
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 sm:truncate">{task.description}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 pl-8 sm:justify-end sm:pl-0">
        {task.dueDate && <DueDateBadge dueDate={task.dueDate} compact />}
        <TaskAssigneeAvatars
          assignees={task.assignees.map((a) => ({
            userId: a.userId,
            name: a.user.name,
            email: a.user.email,
          }))}
          size="xs"
        />
      </div>
    </button>
  );
}
