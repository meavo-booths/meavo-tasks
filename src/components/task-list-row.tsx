import { PriorityBadge } from "@/components/priority-badge";
import { DueDateBadge } from "@/components/due-date-badge";
import { IconCheck } from "@/components/icons";
import { TaskAssigneeAvatars } from "@/components/task-assignee-avatars";
import { PRIORITY_COLORS } from "@/lib/dates";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

export function TaskListRow({
  task,
  onClick,
  showColumn,
  sourceLabel,
  isCompleted = false,
  onToggleComplete,
  pendingComplete = false,
}: {
  task: TaskWithRelations;
  onClick?: () => void;
  showColumn?: boolean;
  sourceLabel?: string;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  pendingComplete?: boolean;
}) {
  if (!task) return null;

  const completeControl = onToggleComplete ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggleComplete();
      }}
      disabled={pendingComplete}
      aria-label={isCompleted ? "Reopen task" : "Complete task"}
      className="touch-target flex shrink-0 items-center justify-center self-start sm:self-center"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
          isCompleted
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-300 bg-white group-hover:border-brand-400"
        }`}
      >
        {isCompleted && <IconCheck size={12} strokeWidth={3} />}
      </span>
    </button>
  ) : (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition group-hover:border-brand-400 sm:mt-0" />
  );

  return (
    <div
      className={`group flex w-full flex-col gap-2 rounded-xl border border-slate-200/80 border-l-4 bg-white px-3 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-card sm:flex-row sm:items-center sm:gap-3 sm:px-4 ${PRIORITY_COLORS[task.priority]} ${
        isCompleted ? "opacity-80" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        {completeControl}

        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 text-left active:opacity-80 sm:active:opacity-100"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-sm font-medium ${
                isCompleted ? "text-slate-500 line-through" : "text-slate-900"
              }`}
            >
              {task.title}
            </p>
            {!isCompleted && <PriorityBadge priority={task.priority} />}
            {showColumn && task.column && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {task.column.name}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 sm:truncate">{task.description}</p>
          )}
          {sourceLabel && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
              {sourceLabel}
            </p>
          )}
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 pl-8 sm:justify-end sm:pl-0">
        {task.dueDate && !isCompleted && <DueDateBadge dueDate={task.dueDate} compact />}
        <TaskAssigneeAvatars
          assignees={task.assignees.map((a) => ({
            userId: a.userId,
            name: a.user.name,
            email: a.user.email,
          }))}
          size="xs"
        />
      </div>
    </div>
  );
}
