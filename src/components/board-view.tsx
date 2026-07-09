"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  addTaskAssignee,
  moveTask,
  removeTaskAssignee,
} from "@/app/actions/tasks";
import { ASSIGNEE_DRAG_TYPE, IconChevronLeft, IconChevronRight } from "@/components/icons";
import { TaskCard } from "@/components/task-card";
import { Badge } from "@/components/ui";
import { useIsMobile } from "@/hooks/use-media-query";
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

const SWIPE_THRESHOLD = 50;

function ColumnPanel({
  column,
  accent,
  isDragTarget,
  canEdit,
  dragEnabled,
  onTaskClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onAddAssignee,
  onRemoveAssignee,
  className = "",
  mobile = false,
}: {
  column: ColumnData;
  accent: string;
  isDragTarget: boolean;
  canEdit: boolean;
  dragEnabled: boolean;
  onTaskClick: (taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onTaskDragStart: (taskId: string) => void;
  onAddAssignee?: (taskId: string, userId: string) => void;
  onRemoveAssignee?: (taskId: string, userId: string) => void;
  className?: string;
  mobile?: boolean;
}) {
  return (
    <div
      className={`kanban-column ${
        isDragTarget
          ? "border-brand-300 bg-brand-50/40 ring-2 ring-brand-100"
          : "border-slate-200/80"
      } ${mobile ? "kanban-column--mobile" : ""} ${className}`}
      onDragOver={dragEnabled ? onDragOver : undefined}
      onDragLeave={dragEnabled ? onDragLeave : undefined}
      onDrop={dragEnabled ? onDrop : undefined}
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
            draggable={dragEnabled}
            onDragStart={() => onTaskDragStart(task.id)}
            onClick={() => onTaskClick(task.id)}
            canEdit={canEdit}
            onAddAssignee={canEdit ? onAddAssignee : undefined}
            onRemoveAssignee={canEdit ? onRemoveAssignee : undefined}
            mobile={mobile}
          />
        ))}

        {column.tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400">
            {mobile
              ? canEdit
                ? "No tasks — add one above or tap + in another column"
                : "No tasks in this column"
              : canEdit
                ? "Drop tasks here"
                : "No tasks"}
          </p>
        )}

        {canEdit && dragEnabled && (
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
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState(columns[0]?.id ?? "");
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const activeIndex = columns.findIndex((c) => c.id === activeColumnId);
  const activeColumn = columns[activeIndex] ?? columns[0];
  const dragEnabled = canEdit && !isMobile;

  useEffect(() => {
    if (!columns.some((c) => c.id === activeColumnId) && columns[0]) {
      setActiveColumnId(columns[0].id);
    }
  }, [columns, activeColumnId]);

  const goToColumn = useCallback(
    (index: number) => {
      const column = columns[index];
      if (column) setActiveColumnId(column.id);
    },
    [columns]
  );

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

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const touchEndY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0 && activeIndex < columns.length - 1) {
        goToColumn(activeIndex + 1);
      } else if (deltaX > 0 && activeIndex > 0) {
        goToColumn(activeIndex - 1);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }

  if (!activeColumn) return null;

  return (
    <>
      {/* Mobile: sticky tabs, swipe, single column */}
      <div className="md:hidden">
        <div className="sticky top-0 z-10 -mx-4 border-b border-slate-200/80 bg-[#f4f6f9]/95 px-4 pb-3 pt-1 backdrop-blur-sm">
          <div className="column-tabs mb-2" role="tablist" aria-label="Board columns">
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
                  className={`column-tab touch-target ${isActive ? "column-tab--active" : "column-tab--inactive"}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${accent}`} />
                    <span className="max-w-[5.5rem] truncate sm:max-w-none">{column.name}</span>
                    <span className="text-xs opacity-70">{column.tasks.length}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => goToColumn(activeIndex - 1)}
              disabled={activeIndex <= 0}
              className="touch-target flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-slate-600 transition active:bg-slate-50 disabled:opacity-30"
              aria-label="Previous column"
            >
              <IconChevronLeft size={18} />
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-xs text-slate-500">
              {activeIndex + 1} of {columns.length} · swipe or tap tabs
            </p>
            <button
              type="button"
              onClick={() => goToColumn(activeIndex + 1)}
              disabled={activeIndex >= columns.length - 1}
              className="touch-target flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-slate-600 transition active:bg-slate-50 disabled:opacity-30"
              aria-label="Next column"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>

        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <ColumnPanel
            column={activeColumn}
            accent={COLUMN_ACCENTS[activeColumn.name] ?? "bg-brand-500"}
            isDragTarget={false}
            canEdit={canEdit}
            dragEnabled={false}
            onTaskClick={onTaskClick}
            onTaskDragStart={setDragTaskId}
            onAddAssignee={handleAddAssignee}
            onRemoveAssignee={handleRemoveAssignee}
            className="w-full"
            mobile
            {...columnDragHandlers(activeColumn.id)}
          />
        </div>
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
              dragEnabled={dragEnabled}
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
