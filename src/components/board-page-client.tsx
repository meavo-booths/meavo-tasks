"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  columns,
  users,
  canEdit,
  defaultColumnId,
}: {
  workspaceId: string;
  columns: ColumnData[];
  users: UserOption[];
  canEdit: boolean;
  defaultColumnId?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allTasks = columns.flatMap((c) => c.tasks);
  const selectedTask = allTasks.find((t) => t?.id === selectedId) ?? null;
  const flatColumns = columns.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      {canEdit && (
        <div className="mb-6">
          <QuickAddTask workspaceId={workspaceId} columnId={defaultColumnId} />
        </div>
      )}
      <BoardView
        workspaceId={workspaceId}
        columns={columns}
        onTaskClick={(id) => setSelectedId(id)}
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
      />
    </>
  );
}
