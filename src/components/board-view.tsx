"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveTask } from "@/app/actions/tasks";
import { TaskCard } from "@/components/task-card";
import { Badge } from "@/components/ui";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

type ColumnData = {
  id: string;
  name: string;
  tasks: TaskWithRelations[];
};

const COLUMN_ACCENTS: Record<string, string> = {
  Backlog: "bg-slate-400",
  "To Do": "bg-sky-400",
  "In Progress": "bg-amber-400",
  Done: "bg-emerald-400",
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
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  function handleDrop(columnId: string, position: number) {
    if (!dragTaskId) return;
    startTransition(async () => {
      await moveTask({ taskId: dragTaskId, columnId, position });
      setDragTaskId(null);
      setDragOverColumn(null);
      router.refresh();
    });
  }

  return (
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-4">
      {columns.map((column) => {
        const accent = COLUMN_ACCENTS[column.name] ?? "bg-brand-500";
        const isDragTarget = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className={`w-80 shrink-0 rounded-2xl border bg-slate-50/80 p-3 transition ${
              isDragTarget
                ? "border-brand-300 bg-brand-50/40 ring-2 ring-brand-100"
                : "border-slate-200/80"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(column.id);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(column.id, column.tasks.length);
            }}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${accent}`} />
              <h3 className="text-sm font-semibold text-slate-800">{column.name}</h3>
              <Badge tone="neutral">{column.tasks.length}</Badge>
            </div>

            <div className="space-y-2">
              {column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  draggable
                  onDragStart={() => setDragTaskId(task.id)}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}

              {column.tasks.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  Drop tasks here
                </p>
              )}

              <div
                className={`h-10 rounded-xl border border-dashed transition ${
                  isDragTarget ? "border-brand-300 bg-brand-50/50" : "border-slate-300/80"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(column.id, column.tasks.length);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
