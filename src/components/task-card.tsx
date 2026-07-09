import { PriorityBadge } from "@/components/priority-badge";
import { DueDateBadge } from "@/components/due-date-badge";
import { IconGrip } from "@/components/icons";
import { AvatarStack } from "@/components/user-avatar";
import { PRIORITY_COLORS } from "@/lib/dates";
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
      className={`group w-full rounded-xl border border-slate-200/80 border-l-4 bg-white p-3 text-left shadow-sm transition hover:border-brand-300 hover:shadow-card ${PRIORITY_COLORS[task.priority]} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <span className="mt-0.5 text-slate-300 opacity-0 transition group-hover:opacity-100">
            <IconGrip size={14} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-medium leading-snug text-slate-900">{task.title}</p>
            <PriorityBadge priority={task.priority} compact />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {task.dueDate ? (
              <DueDateBadge dueDate={task.dueDate} compact />
            ) : (
              <span />
            )}
            <AvatarStack
              users={task.assignees.map((a) => ({
                userId: a.userId,
                name: a.user.name,
                email: a.user.email,
              }))}
              size="xs"
            />
          </div>
        </div>
      </div>
    </button>
  );
}
