"use client";

import { useState } from "react";
import { PriorityBadge } from "@/components/priority-badge";
import { DueDateBadge } from "@/components/due-date-badge";
import { ASSIGNEE_DRAG_TYPE, IconGrip, TASK_DRAG_TYPE } from "@/components/icons";
import { TaskAssigneeAvatars } from "@/components/task-assignee-avatars";
import { memberAssignees, externalAssignees } from "@/lib/task-assignees";
import { PRIORITY_COLORS } from "@/lib/dates";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

export function TaskCard({
  task,
  onClick,
  draggable,
  onDragStart,
  canEdit = false,
  onAddAssignee,
  onRemoveAssignee,
}: {
  task: TaskWithRelations;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  canEdit?: boolean;
  onAddAssignee?: (taskId: string, userId: string) => void;
  onRemoveAssignee?: (taskId: string, userId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  if (!task) return null;

  const memberUsers = memberAssignees(task);
  const externalUsers = externalAssignees(task);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(TASK_DRAG_TYPE, task.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(e);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!canEdit || !e.dataTransfer.types.includes(ASSIGNEE_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const userId = e.dataTransfer.getData(ASSIGNEE_DRAG_TYPE);
    if (userId && onAddAssignee) {
      onAddAssignee(task.id, userId);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group w-full rounded-xl border border-l-4 bg-white p-3 text-left shadow-sm transition hover:border-brand-300 hover:shadow-card ${PRIORITY_COLORS[task.priority]} ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${
        dragOver ? "border-brand-400 bg-brand-50/50 ring-2 ring-brand-100" : "border-slate-200/80"
      }`}
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
            <div className="flex items-center gap-1">
              <TaskAssigneeAvatars
                assignees={memberUsers.map((a) => ({
                  userId: a.userId,
                  name: a.user.name,
                  email: a.user.email,
                }))}
                canEdit={canEdit}
                onRemove={
                  onRemoveAssignee
                    ? (userId) => onRemoveAssignee(task.id, userId)
                    : undefined
                }
                size="xs"
              />
              {externalUsers.length > 0 && (
                <TaskAssigneeAvatars
                  assignees={externalUsers.map((a) => ({
                    userId: a.userId,
                    name: a.user.name,
                    email: a.user.email,
                  }))}
                  size="xs"
                  showMissingWarning={false}
                  variant="external"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
