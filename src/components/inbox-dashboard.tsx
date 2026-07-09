"use client";

import Link from "next/link";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { TaskListRow } from "@/components/task-list-row";
import { TaskListView } from "@/components/task-list-view";
import { QuickAddTask } from "@/components/quick-add-task";
import { PriorityBadge } from "@/components/priority-badge";
import { DueDateBadge } from "@/components/due-date-badge";
import { IconBoard, IconChevronDown, IconInbox } from "@/components/icons";
import { Badge, Card, SectionHeader, StatCard } from "@/components/ui";
import type { BoardDashboardSummary, TaskWithRelations } from "@/lib/domain/task-queries";
import { TaskWorkspaceType } from "@prisma/client";

type UserOption = { id: string; name: string | null; email: string };

type SharedTask = TaskWithRelations & {
  workspace: { id: string; name: string; type: TaskWorkspaceType };
};

function boardTypeLabel(type: TaskWorkspaceType, teamName: string | null) {
  if (type === TaskWorkspaceType.TEAM) return teamName ?? "Team board";
  if (type === TaskWorkspaceType.SHARED) return "Shared board";
  return "Personal";
}

function BoardSummaryCard({
  board,
  expanded,
  onToggle,
  onTaskClick,
}: {
  board: BoardDashboardSummary;
  expanded: boolean;
  onToggle: () => void;
  onTaskClick: (taskId: string) => void;
}) {
  return (
    <Card padding={false} hover className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{board.name}</h3>
            <Badge tone="neutral">{board.openCount} open</Badge>
            {board.urgentCount > 0 && <Badge tone="danger">{board.urgentCount} urgent</Badge>}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {boardTypeLabel(board.type, board.teamName)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {board.dueTodayCount > 0 && (
              <Badge tone="danger">{board.dueTodayCount} due today</Badge>
            )}
            {board.dueSoonCount > 0 && <Badge tone="warning">{board.dueSoonCount} due soon</Badge>}
            {board.inProgressCount > 0 && (
              <Badge tone="brand">{board.inProgressCount} in progress</Badge>
            )}
          </div>
          {board.teamColor && (
            <div
              className="mt-3 h-1 w-full max-w-[120px] rounded-full"
              style={{ backgroundColor: board.teamColor }}
            />
          )}
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition ${expanded ? "rotate-180" : ""}`}
        >
          <IconChevronDown size={18} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          {board.tasks.length === 0 ? (
            <p className="text-sm text-slate-500">No open tasks on this board.</p>
          ) : (
            <div className="space-y-2">
              {board.tasks.slice(0, 12).map((task) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  showColumn
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
              {board.tasks.length > 12 && (
                <p className="px-1 text-xs text-slate-500">
                  +{board.tasks.length - 12} more on this board
                </p>
              )}
            </div>
          )}
          <Link
            href={`/boards/${board.id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Open full board
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </Card>
  );
}

function SharedUpcomingSection({
  tasks,
  onTaskClick,
}: {
  tasks: SharedTask[];
  onTaskClick: (taskId: string) => void;
}) {
  if (tasks.length === 0) return null;

  const today = new Date();

  return (
    <section className="mb-8 sm:mb-10">
      <SectionHeader
        title="Coming up on boards"
        description="Assigned to you — due today or in the next few days."
        icon={<IconBoard size={18} />}
      />
      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onTaskClick(task.id)}
            className="flex w-full flex-col gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow-card sm:flex-row sm:items-center sm:gap-3 sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  <PriorityBadge priority={task.priority} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{task.workspace.name}</p>
              </div>
            </div>
            {task.dueDate &&
              (isSameDay(task.dueDate, today) ? (
                <DueDateBadge dueDate={task.dueDate} />
              ) : (
                <span className="shrink-0 pl-8 text-xs text-slate-500 sm:pl-0">
                  {format(task.dueDate, "EEE, MMM d")}
                </span>
              ))}
          </button>
        ))}
      </div>
    </section>
  );
}

function ExternalSharedSection({
  tasks,
  onTaskClick,
}: {
  tasks: SharedTask[];
  onTaskClick: (taskId: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-10">
      <SectionHeader
        title="Shared with you"
        description="Individual tasks shared with you — not full board access."
        icon={<IconInbox size={18} />}
      />
      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onTaskClick(task.id)}
            className="flex w-full flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-left shadow-sm transition hover:border-slate-400 hover:shadow-card sm:flex-row sm:items-center sm:gap-3 sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  <PriorityBadge priority={task.priority} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {task.workspace.name} · task only
                </p>
              </div>
            </div>
            {task.dueDate && (
              <span className="shrink-0 pl-8 text-xs text-slate-500 sm:pl-0">
                {format(task.dueDate, "EEE, MMM d")}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export function InboxDashboard({
  personalWorkspaceId,
  personalTasks,
  boardSummaries,
  sharedUpcoming,
  externalShared,
  users,
  personalColumns,
  currentUserId,
}: {
  personalWorkspaceId: string;
  personalTasks: TaskWithRelations[];
  boardSummaries: BoardDashboardSummary[];
  sharedUpcoming: SharedTask[];
  externalShared: SharedTask[];
  users: UserOption[];
  personalColumns: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTasks = [
    ...personalTasks,
    ...boardSummaries.flatMap((b) => b.tasks),
    ...sharedUpcoming,
    ...externalShared,
  ];
  const selectedTask = allTasks.find((t) => t?.id === selectedId) ?? null;

  const modalColumns = (() => {
    if (!selectedTask) return personalColumns;
    const board = boardSummaries.find((b) => b.id === selectedTask.workspaceId);
    return board?.columns.length ? board.columns : personalColumns;
  })();

  const modalWorkspaceType = (() => {
    if (!selectedTask) return undefined;
    const external = externalShared.find((t) => t.id === selectedTask.id);
    if (external) return external.workspace.type;
    const shared = sharedUpcoming.find((t) => t.id === selectedTask.id);
    if (shared) return shared.workspace.type;
    const board = boardSummaries.find((b) => b.id === selectedTask.workspaceId);
    if (board) return board.type;
    return TaskWorkspaceType.PERSONAL;
  })();

  const stats = {
    personal: personalTasks.length,
    upcoming: sharedUpcoming.length,
    external: externalShared.length,
    boards: boardSummaries.length,
    urgent: boardSummaries.reduce((sum, b) => sum + b.urgentCount, 0),
  };

  function toggleBoard(boardId: string) {
    setExpandedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Personal tasks" value={stats.personal} />
        <StatCard label="Board deadlines" value={stats.upcoming} tone="warning" />
        <StatCard label="Shared task-only" value={stats.external} tone="brand" />
        <StatCard label="Active boards" value={stats.boards} tone="brand" />
        <StatCard label="Urgent / high" value={stats.urgent} tone="danger" />
      </div>

      <ExternalSharedSection tasks={externalShared} onTaskClick={setSelectedId} />

      <SharedUpcomingSection tasks={sharedUpcoming} onTaskClick={setSelectedId} />

      <section className="mb-8 sm:mb-10">
        <SectionHeader
          title="My personal tasks"
          description="Private inbox — grouped by due date."
          icon={<IconInbox size={18} />}
        />
        <div className="mb-4">
          <QuickAddTask workspaceId={personalWorkspaceId} />
        </div>
        <TaskListView
          tasks={personalTasks}
          columns={personalColumns}
          users={users}
          canEdit
          onTaskClick={setSelectedId}
        />
      </section>

      {boardSummaries.length > 0 && (
        <section>
          <SectionHeader
            title="Active boards"
            description="Click a board to expand and preview its open tasks."
            icon={<IconBoard size={18} />}
          />
          <div className="space-y-3">
            {boardSummaries.map((board) => (
              <BoardSummaryCard
                key={board.id}
                board={board}
                expanded={expandedBoards.has(board.id)}
                onToggle={() => toggleBoard(board.id)}
                onTaskClick={setSelectedId}
              />
            ))}
          </div>
        </section>
      )}

      <TaskDetailModal
        task={selectedTask}
        columns={modalColumns}
        users={users}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        canEdit
        workspaceType={modalWorkspaceType}
        currentUserId={currentUserId}
      />
    </>
  );
}
