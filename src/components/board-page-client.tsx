"use client";

import { TaskWorkspaceType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssigneePalette } from "@/components/assignee-palette";
import { BoardView } from "@/components/board-view";
import { QuickAddTask } from "@/components/quick-add-task";
import { TaskDetailModal } from "@/components/task-detail-modal";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

type ColumnData = {
  id: string;
  name: string;
  tasks: TaskWithRelations[];
};

type UserOption = { id: string; name: string | null; email: string };

export function BoardPageClient({
  workspaceId,
  workspaceType,
  columns,
  users,
  canEdit,
  defaultColumnId,
  assigneeOptions,
  externalCandidateUsers,
  currentUserId,
}: {
  workspaceId: string;
  workspaceType: TaskWorkspaceType;
  columns: ColumnData[];
  users: UserOption[];
  canEdit: boolean;
  defaultColumnId?: string;
  assigneeOptions?: UserOption[];
  externalCandidateUsers?: UserOption[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTasks = columns.flatMap((c) => c.tasks);
  const selectedTask = allTasks.find((t) => t?.id === selectedId) ?? null;
  const flatColumns = columns.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      {canEdit && (
        <div className="mb-5 space-y-3 md:mb-6">
          <div className="sticky top-0 z-10 -mx-3 border-b border-slate-200/60 bg-[#f4f6f9]/95 px-3 py-3 backdrop-blur-sm md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <QuickAddTask
              workspaceId={workspaceId}
              columnId={defaultColumnId}
              assigneeOptions={assigneeOptions}
              currentUserId={currentUserId}
            />
          </div>
          <p className="mobile-only-hint">
            Tap a task to edit. Swipe columns or use arrows to move between stages.
          </p>
          {assigneeOptions && assigneeOptions.length > 1 && (
            <AssigneePalette users={assigneeOptions} />
          )}
        </div>
      )}
      <BoardView
        workspaceId={workspaceId}
        columns={columns}
        onTaskClick={(id) => setSelectedId(id)}
        canEdit={canEdit}
      />
      <TaskDetailModal
        task={selectedTask}
        columns={flatColumns}
        users={users}
        open={!!selectedId}
        onClose={() => {
          setSelectedId(null);
          router.refresh();
        }}
        canEdit={canEdit}
        workspaceType={workspaceType}
        boardMemberUsers={assigneeOptions}
        externalCandidateUsers={externalCandidateUsers}
        currentUserId={currentUserId}
      />
    </>
  );
}
