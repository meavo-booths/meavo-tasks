"use client";

import { useMemo, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { CreateBoardForms } from "@/components/create-board-forms";
import { MobileBoardStrip } from "@/components/mobile-board-strip";
import { MobileBottomNav, MobileFab, type MobileTab } from "@/components/mobile-bottom-nav";
import { PriorityHighlightSection } from "@/components/priority-highlight-section";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { TaskListRow } from "@/components/task-list-row";
import { TaskListView } from "@/components/task-list-view";
import { QuickAddTask } from "@/components/quick-add-task";
import { PriorityBadge } from "@/components/priority-badge";
import { DueDateBadge } from "@/components/due-date-badge";
import { IconBoard, IconChevronDown, IconInbox, IconPlus } from "@/components/icons";
import { Badge, Button, Card, EmptyState, SectionHeader, StatCard } from "@/components/ui";
import { DUE_GROUP_LABELS, groupTasksByDueDate } from "@/lib/dates";
import type { BoardDashboardSummary, TaskWithRelations } from "@/lib/domain/task-queries";
import { buildTodayTaskItems } from "@/lib/today-tasks";
import { TaskWorkspaceType } from "@prisma/client";

type UserOption = { id: string; name: string | null; email: string };

type TeamOption = {
  team: {
    id: string;
    name: string;
  };
};

type BoardAssigneeOptions = {
  members: UserOption[];
  external: UserOption[];
};

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
  assigneeOptions,
  currentUserId,
  kanbanOnExpand = false,
}: {
  board: BoardDashboardSummary;
  expanded: boolean;
  onToggle: () => void;
  onTaskClick: (taskId: string) => void;
  assigneeOptions?: BoardAssigneeOptions;
  currentUserId: string;
  kanbanOnExpand?: boolean;
}) {
  const defaultColumnId =
    board.columns.find((c) => c.name === "To Do")?.id ?? board.columns[0]?.id;

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
          {!expanded && (
            <div className="mt-3 flex flex-wrap gap-2">
              {board.dueTodayCount > 0 && (
                <Badge tone="danger">{board.dueTodayCount} due today</Badge>
              )}
              {board.dueSoonCount > 0 && (
                <Badge tone="warning">{board.dueSoonCount} due soon</Badge>
              )}
              {board.inProgressCount > 0 && (
                <Badge tone="brand">{board.inProgressCount} in progress</Badge>
              )}
            </div>
          )}
          {board.teamColor && (
            <div
              className="mt-3 h-1 w-full max-w-[120px] rounded-full"
              style={{ backgroundColor: board.teamColor }}
            />
          )}
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition ${expanded ? "rotate-180" : ""}`}
        >
          <IconChevronDown size={18} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <div className="mb-4">
            <QuickAddTask
              workspaceId={board.id}
              columnId={defaultColumnId}
              assigneeOptions={assigneeOptions?.members}
              currentUserId={currentUserId}
            />
          </div>

          {board.tasks.length === 0 ? (
            <p className="text-sm text-slate-500">No open tasks on this board yet.</p>
          ) : kanbanOnExpand ? (
            <MobileBoardStrip board={board} onTaskClick={onTaskClick} />
          ) : (
            <div className="space-y-2">
              {board.tasks.map((task) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  showColumn
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            </div>
          )}
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

function MobileTodayView({
  items,
  onTaskClick,
}: {
  items: ReturnType<typeof buildTodayTaskItems>;
  onTaskClick: (taskId: string) => void;
}) {
  const tasks = items.map((item) => item.task);
  const groups = groupTasksByDueDate(tasks);
  const sourceById = Object.fromEntries(items.map((item) => [item.task.id, item.sourceLabel]));
  const hasTasks = groups.overdue.length > 0 || groups.today.length > 0;

  if (!hasTasks) {
    return (
      <EmptyState
        icon={<IconInbox size={28} />}
        title="Nothing due today"
        description="Personal and shared tasks due today or overdue will show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {(["overdue", "today"] as const).map((key) => {
        const sectionTasks = groups[key];
        if (sectionTasks.length === 0) return null;
        return (
          <section key={key}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                {DUE_GROUP_LABELS[key]}
              </h3>
              <Badge tone={key === "overdue" ? "danger" : "warning"}>{sectionTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {sectionTasks.map((task) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  sourceLabel={sourceById[task.id]}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
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
  teamsWithoutBoard,
  boardAssigneeOptions,
}: {
  personalWorkspaceId: string;
  personalTasks: TaskWithRelations[];
  boardSummaries: BoardDashboardSummary[];
  sharedUpcoming: SharedTask[];
  externalShared: SharedTask[];
  users: UserOption[];
  personalColumns: { id: string; name: string }[];
  currentUserId: string;
  teamsWithoutBoard: TeamOption[];
  boardAssigneeOptions: Record<string, BoardAssigneeOptions>;
}) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("today");
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set());
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showMobileAdd, setShowMobileAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  const todayItems = useMemo(
    () =>
      buildTodayTaskItems({
        personalTasks,
        boardSummaries,
        sharedUpcoming,
        externalShared,
        currentUserId,
      }),
    [personalTasks, boardSummaries, sharedUpcoming, externalShared, currentUserId]
  );

  const todayCount = todayItems.length;

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

  const modalAssignees = selectedTask
    ? boardAssigneeOptions[selectedTask.workspaceId]
    : undefined;

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

  function handleMobileFab() {
    if (mobileTab === "shared") {
      setShowCreateBoard(true);
      return;
    }
    setShowMobileAdd(true);
    requestAnimationFrame(() => {
      quickAddRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const boardsSection = (kanbanOnExpand = false) => (
    <>
      {showCreateBoard && (
        <div className="mb-4">
          <CreateBoardForms teamsWithoutBoard={teamsWithoutBoard} />
        </div>
      )}

      {boardSummaries.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm font-medium text-slate-700">No boards yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a team or shared board to collaborate with others.
          </p>
          {!showCreateBoard && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setShowCreateBoard(true)}
            >
              <IconPlus size={14} />
              Create a board
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {boardSummaries.map((board) => (
            <BoardSummaryCard
              key={board.id}
              board={board}
              expanded={expandedBoards.has(board.id)}
              onToggle={() => toggleBoard(board.id)}
              onTaskClick={setSelectedId}
              assigneeOptions={boardAssigneeOptions[board.id]}
              currentUserId={currentUserId}
              kanbanOnExpand={kanbanOnExpand}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="mobile-dashboard">
      {/* Mobile tab layout */}
      <div className="md:hidden">
        {mobileTab === "today" && (
          <>
            <h1 className="mobile-screen-title">Today</h1>
            <p className="mobile-screen-subtitle">{format(new Date(), "d MMM · EEEE")}</p>
            {showMobileAdd && (
              <div ref={quickAddRef} className="mb-4">
                <QuickAddTask
                  workspaceId={personalWorkspaceId}
                  currentUserId={currentUserId}
                />
              </div>
            )}
            <MobileTodayView items={todayItems} onTaskClick={setSelectedId} />
          </>
        )}

        {mobileTab === "personal" && (
          <>
            <h1 className="mobile-screen-title">Personal</h1>
            <p className="mobile-screen-subtitle">Your private tasks</p>
            <div ref={quickAddRef} className="mb-4">
              {(showMobileAdd || personalTasks.length === 0) && (
                <QuickAddTask
                  workspaceId={personalWorkspaceId}
                  currentUserId={currentUserId}
                />
              )}
            </div>
            <TaskListView
              tasks={personalTasks}
              columns={personalColumns}
              users={users}
              canEdit
              onTaskClick={setSelectedId}
              currentUserId={currentUserId}
            />
          </>
        )}

        {mobileTab === "shared" && (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shared</h1>
                <p className="mt-1 text-sm text-slate-500">Team boards</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBoard((value) => !value)}
                aria-label={showCreateBoard ? "Hide new board form" : "Create new board"}
                aria-expanded={showCreateBoard}
                className={`touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                  showCreateBoard
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 active:bg-brand-50"
                }`}
              >
                <IconPlus size={18} />
              </button>
            </div>
            <PriorityHighlightSection
              boards={boardSummaries}
              onTaskClick={setSelectedId}
            />
            {boardsSection(true)}
          </>
        )}

        <MobileBottomNav
          active={mobileTab}
          onChange={setMobileTab}
          todayCount={todayCount}
        />

        <MobileFab
          label={mobileTab === "shared" ? "Create new board" : "Add task"}
          onClick={handleMobileFab}
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block">
        <div className="stat-grid">
          <StatCard label="Personal tasks" value={stats.personal} />
          <StatCard label="Board deadlines" value={stats.upcoming} tone="warning" />
          <StatCard label="Shared task-only" value={stats.external} tone="brand" />
          <StatCard label="Active boards" value={stats.boards} tone="brand" />
          <StatCard label="Urgent / high" value={stats.urgent} tone="danger" />
        </div>

        <section className="mb-8 sm:mb-10">
          <SectionHeader
            title="Boards"
            description="Team and shared workspaces — tap to expand, add tasks, and assign people."
            icon={<IconBoard size={17} />}
            titleTrailing={
              <button
                type="button"
                onClick={() => setShowCreateBoard((value) => !value)}
                aria-label={showCreateBoard ? "Hide new board form" : "Create new board"}
                aria-expanded={showCreateBoard}
                className={`touch-target flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                  showCreateBoard
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-50"
                }`}
              >
                <IconPlus size={16} />
              </button>
            }
          />
          {boardsSection(false)}
        </section>

        <ExternalSharedSection tasks={externalShared} onTaskClick={setSelectedId} />
        <SharedUpcomingSection tasks={sharedUpcoming} onTaskClick={setSelectedId} />

        <section className="mb-8 sm:mb-10">
          <SectionHeader
            title="My personal tasks"
            description="Private inbox — grouped by due date."
            icon={<IconInbox size={17} />}
          />
          <div className="mb-4">
            <QuickAddTask workspaceId={personalWorkspaceId} currentUserId={currentUserId} />
          </div>
          <TaskListView
            tasks={personalTasks}
            columns={personalColumns}
            users={users}
            canEdit
            onTaskClick={setSelectedId}
            currentUserId={currentUserId}
          />
        </section>
      </div>

      <TaskDetailModal
        task={selectedTask}
        columns={modalColumns}
        users={users}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        canEdit
        workspaceType={modalWorkspaceType}
        boardMemberUsers={modalAssignees?.members}
        externalCandidateUsers={modalAssignees?.external}
        currentUserId={currentUserId}
      />
    </div>
  );
}
