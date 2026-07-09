"use client";

import { useState } from "react";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { TaskListRow } from "@/components/task-list-row";
import {
  DUE_GROUP_LABELS,
  groupTasksByDueDate,
  type DueDateGroup,
} from "@/lib/dates";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

type UserOption = { id: string; name: string | null; email: string };

const GROUP_ORDER: DueDateGroup[] = ["overdue", "today", "upcoming", "no_date"];

export function TaskListView({
  tasks,
  columns,
  users,
  canEdit,
}: {
  tasks: TaskWithRelations[];
  columns: { id: string; name: string }[];
  users: UserOption[];
  canEdit: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const groups = groupTasksByDueDate(tasks.filter(Boolean) as TaskWithRelations[]);
  const selectedTask = tasks.find((t) => t?.id === selectedId) ?? null;

  return (
    <>
      <div className="space-y-6">
        {GROUP_ORDER.map((key) => {
          const items = groups[key];
          if (items.length === 0) return null;
          return (
            <section key={key}>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">
                {DUE_GROUP_LABELS[key]}
              </h2>
              <div className="space-y-2">
                {items.map((task) => (
                  <TaskListRow
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedId(task.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {tasks.length === 0 && (
          <p className="text-sm text-slate-500">No open tasks. Add one above.</p>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        columns={columns}
        users={users}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        canEdit={canEdit}
      />
    </>
  );
}
