"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addTaskAssignee,
  moveTask,
  removeTaskAssignee,
} from "@/app/actions/tasks";
import { ASSIGNEE_DRAG_TYPE } from "@/components/icons";
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

function ColumnPanel({
  column,
  accent,
  isDragTarget,
  canEdit,
  onTaskClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onAddAssignee,
  onRemoveAssignee,
  className = "",
}: {
  column: ColumnData;
  accent: string;
  isDragTarget: boolean;
  canEdit: boolean;
  onTaskClick: (taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onTaskDragStart: (taskId: string) => void;
  onAddAssignee?: (taskId: string, userId: string) => void;
  onRemoveAssignee?: (taskId: string, userId: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`kanban-column ${
        isDragTarget
          ? "border-brand-300 bg-brand-50/40 ring-2 ring-brand-100"
          : "border-slate-200/80"
      } ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
            draggable={canEdit}
            onDragStart={() => onTaskDragStart(task.id)}
            onClick={() => onTaskClick(task.id)}
            canEdit={canEdit}
            onAddAssignee={canEdit ? onAddAssignee : undefined}
            onRemoveAssignee={canEdit ? onRemoveAssignee : undefined}
          />
        ))}

        {column.tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
            {canEdit ? "Drop tasks here" : "No tasks"}
          </p>
        )}

        {canEdit && (
          <div
            className={`h-10 rounded-xl border border-dashed transition ${
              isDragTarget ? "border-brand-300 bg-brand-50/50" : "border-slate-300/80"
            }`}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(ASSIGNEE_DRAG_TYPE)) return;
              e.preventDefault();
            }}
            onDrop={onDrop}
          />
        )}
      </div>
    </div>
  );
}

export function BoardView({
  columns,
  onTaskClick,
  canEdit = false,
}: {
  workspaceId: string;
  columns: ColumnData[];
  onTaskClick: (taskId: string) => void;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState(columns[0]?.id ?? "");

  const activeColumn = columns.find((c) => c.id === activeColumnId) ?? columns[0];

  function handleTaskDrop(columnId: string, position: number) {
    if (!dragTaskId) return;
    startTransition(async () => {
      await moveTask({ taskId: dragTaskId, columnId, position });
      setDragTaskId(null);
      setDragOverColumn(null);
      router.refresh();
    });
  }

  function handleAddAssignee(taskId: string, userId: string) {
    startTransition(async () => {
      await addTaskAssignee(taskId, userId);
      router.refresh();
    });
  }

  function handleRemoveAssignee(taskId: string, userId: string) {
    startTransition(async () => {
      await removeTaskAssignee(taskId, userId);
      router.refresh();
    });
  }

  function columnDragHandlers(columnId: string) {
    return {
      onDragOver: (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes(ASSIGNEE_DRAG_TYPE)) return;
        e.preventDefault();
        setDragOverColumn(columnId);
      },
      onDragLeave: () => setDragOverColumn(null),
      onDrop: (e: React.DragEvent) => {
        if (e.dataTransfer.getData(ASSIGNEE_DRAG_TYPE)) return;
        e.preventDefault();
        const column = columns.find((c) => c.id === columnId);
        handleTaskDrop(columnId, column?.tasks.length ?? 0);
      },
    };
  }

  if (!activeColumn) return null;

  return (
    <>
      {/* Mobile: column tabs + single column */}
      <div className="md:hidden">
        <div className="column-tabs" role="tablist" aria-label="Board columns">
          {columns.map((column) => {
            const accent = COLUMN_ACCENTS[column.name] ?? "bg-brand-500";
            const isActive = column.id === activeColumn.id;
            return (
              <button
                key={column.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveColumnId(column.id)}
                className={`column-tab ${isActive ? "column-tab--active" : "column-tab--inactive"}`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
                  {column.name}
                  <span className="text-xs opacity-70">({column.tasks.length})</span>
                </span>
              </button>
            );
          })}
        </div>

        <ColumnPanel
          column={activeColumn}
          accent={COLUMN_ACCENTS[activeColumn.name] ?? "bg-brand-500"}
          isDragTarget={dragOverColumn === activeColumn.id}
          canEdit={canEdit}
          onTaskClick={onTaskClick}
          onTaskDragStart={setDragTaskId}
          onAddAssignee={handleAddAssignee}
          onRemoveAssignee={handleRemoveAssignee}
          className="w-full"
          {...columnDragHandlers(activeColumn.id)}
        />
      </div>

      {/* Desktop: horizontal kanban */}
      <div className="kanban-scroll hidden md:flex">
        {columns.map((column) => {
          const accent = COLUMN_ACCENTS[column.name] ?? "bg-brand-500";
          return (
            <ColumnPanel
              key={column.id}
              column={column}
              accent={accent}
              isDragTarget={dragOverColumn === column.id}
              canEdit={canEdit}
              onTaskClick={onTaskClick}
              onTaskDragStart={setDragTaskId}
              onAddAssignee={handleAddAssignee}
              onRemoveAssignee={handleRemoveAssignee}
              {...columnDragHandlers(column.id)}
            />
          );
        })}
      </div>
    </>
  );
}
