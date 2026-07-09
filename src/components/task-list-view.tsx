"use client";

import { TaskWorkspaceType } from "@prisma/client";
import { useState } from "react";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { TaskListRow } from "@/components/task-list-row";
import { IconInbox } from "@/components/icons";
import { Badge, EmptyState } from "@/components/ui";
import {
  DUE_GROUP_LABELS,
  groupTasksByDueDate,
  type DueDateGroup,
} from "@/lib/dates";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

type UserOption = { id: string; name: string | null; email: string };

const GROUP_ORDER: DueDateGroup[] = ["overdue", "today", "upcoming", "no_date"];

const GROUP_TONES: Record<DueDateGroup, "danger" | "warning" | "neutral" | "brand"> = {
  overdue: "danger",
  today: "warning",
  upcoming: "neutral",
  no_date: "brand",
};

export function TaskListView({
  tasks,
  columns,
  users,
  canEdit,
  onTaskClick,
  workspaceType,
  boardMemberUsers,
  externalCandidateUsers,
  currentUserId,
}: {
  tasks: TaskWithRelations[];
  columns: { id: string; name: string }[];
  users: UserOption[];
  canEdit: boolean;
  onTaskClick?: (taskId: string) => void;
  workspaceType?: TaskWorkspaceType;
  boardMemberUsers?: UserOption[];
  externalCandidateUsers?: UserOption[];
  currentUserId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const groups = groupTasksByDueDate(tasks.filter(Boolean) as TaskWithRelations[]);
  const selectedTask = tasks.find((t) => t?.id === selectedId) ?? null;

  function handleClick(taskId: string) {
    if (onTaskClick) onTaskClick(taskId);
    else setSelectedId(taskId);
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<IconInbox size={28} />}
        title="No tasks yet"
        description="Add your first task above to start organizing your work."
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {GROUP_ORDER.map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          return (
            <section key={key}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {DUE_GROUP_LABELS[key]}
                </h3>
                <Badge tone={GROUP_TONES[key]}>{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <TaskListRow
                    key={task.id}
                    task={task}
                    onClick={() => handleClick(task.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {!onTaskClick && (
        <TaskDetailModal
          task={selectedTask}
          columns={columns}
          users={users}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
          canEdit={canEdit}
          workspaceType={workspaceType}
          boardMemberUsers={boardMemberUsers}
          externalCandidateUsers={externalCandidateUsers}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
