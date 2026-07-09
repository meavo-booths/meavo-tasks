"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { attachExternalLink, detachExternalLink } from "@/app/actions/links";
import {
  completeTask,
  deleteTask,
  reopenTask,
  setTaskAssignees,
  updateTask,
} from "@/app/actions/tasks";
import { LinkEntityPicker } from "@/components/link-entity-picker";
import { Modal } from "@/components/modal";
import { PriorityBadge } from "@/components/priority-badge";
import { Button, Input, Select } from "@/components/ui";
import { PRIORITY_OPTIONS } from "@/lib/tasks-config";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

type UserOption = { id: string; name: string | null; email: string };

export function TaskDetailModal({
  task,
  columns,
  users,
  open,
  onClose,
  canEdit,
}: {
  task: TaskWithRelations | null;
  columns: { id: string; name: string }[];
  users: UserOption[];
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [, attachAction, attachPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => attachExternalLink(formData),
    {}
  );

  useEffect(() => {
    if (task) {
      setSelectedAssignees(task.assignees.map((a) => a.userId));
      setError(null);
    }
  }, [task]);

  if (!task) return null;

  const isCompleted = task.status === "COMPLETED";

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateTask(formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleAssignees() {
    startTransition(async () => {
      const result = await setTaskAssignees(task!.id, selectedAssignees);
      if (result.error) setError(result.error);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      const result = isCompleted
        ? await reopenTask(task!.id)
        : await completeTask(task!.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this task?")) return;
    startTransition(async () => {
      const result = await deleteTask(task!.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  async function handleDetach(linkId: string) {
    const result = await detachExternalLink(linkId);
    if (result.error) setError(result.error);
  }

  return (
    <Modal open={open} onClose={onClose} title={task.title} wide>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {canEdit ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <input type="hidden" name="taskId" value={task.id} />
          <Input label="Title" name="title" defaultValue={task.title} required />
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              name="description"
              defaultValue={task.description}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Priority"
              name="priority"
              defaultValue={task.priority}
              options={PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
            />
            <Select
              label="Column"
              name="columnId"
              defaultValue={task.columnId ?? ""}
              options={columns.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Input
              label="Start date"
              name="startDate"
              type="date"
              defaultValue={task.startDate ? task.startDate.toISOString().slice(0, 10) : ""}
            />
            <Input
              label="Due date"
              name="dueDate"
              type="date"
              defaultValue={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={handleComplete} disabled={pending}>
              {isCompleted ? "Reopen" : "Complete"}
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>
              Delete
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-sm text-slate-600">
          <p>{task.description || "No description."}</p>
          <p className="flex items-center gap-2">
            Priority:
            {task.priority === "NONE" ? (
              <span>None</span>
            ) : (
              <PriorityBadge priority={task.priority} />
            )}
          </p>
          {task.dueDate && <p>Due: {task.dueDate.toLocaleDateString()}</p>}
        </div>
      )}

      {canEdit && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Assignees</p>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAssignees.includes(u.id)}
                  onChange={(e) => {
                    setSelectedAssignees((prev) =>
                      e.target.checked
                        ? [...prev, u.id]
                        : prev.filter((id) => id !== u.id)
                    );
                  }}
                />
                {u.name ?? u.email}
              </label>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={handleAssignees}
            disabled={pending}
          >
            Update assignees
          </Button>
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Linked items</p>
        <div className="flex flex-wrap gap-2">
          {task.externalLinks.map((link) => (
            <a
              key={link.id}
              href={link.deepLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              {link.displayLabel}
              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleDetach(link.id);
                  }}
                  className="ml-1 text-brand-500 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </a>
          ))}
        </div>
        {canEdit && (
          <form action={attachAction} className="mt-3">
            <input type="hidden" name="taskId" value={task.id} />
            <LinkEntityPicker disabled={attachPending} />
          </form>
        )}
      </div>
    </Modal>
  );
}

type ActionResult = { error?: string };
