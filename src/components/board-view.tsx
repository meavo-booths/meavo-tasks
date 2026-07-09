"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveTask } from "@/app/actions/tasks";
import { TaskCard } from "@/components/task-card";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

type ColumnData = {
  id: string;
  name: string;
  tasks: TaskWithRelations[];
};

export function BoardView({
  workspaceId,
  columns,
  onTaskClick,
}: {
  workspaceId: string;
  columns: ColumnData[];
  onTaskClick: (taskId: string) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  function handleDrop(columnId: string, position: number) {
    if (!dragTaskId) return;
    startTransition(async () => {
      await moveTask({ taskId: dragTaskId, columnId, position });
      setDragTaskId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(column.id, column.tasks.length);
          }}
        >
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {column.name}
            <span className="ml-2 font-normal text-slate-400">
              {column.tasks.length}
            </span>
          </h3>
          <div className="space-y-2">
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                draggable
                onDragStart={() => setDragTaskId(task.id)}
                onClick={() => onTaskClick(task.id)}
              />
            ))}
            <div
              className="h-8 rounded-lg border border-dashed border-slate-300"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(column.id, column.tasks.length);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
