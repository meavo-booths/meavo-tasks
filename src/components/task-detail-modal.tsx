"use client";

import { TaskAssigneeScope, TaskWorkspaceType } from "@prisma/client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { attachExternalLink, detachExternalLink } from "@/app/actions/links";
import {
  completeTask,
  deleteTask,
  reopenTask,
  setTaskExternalAssignees,
  setTaskMemberAssignees,
  updateTask,
} from "@/app/actions/tasks";
import {
  getExternalAssigneeCandidates,
  getWorkspaceAssigneeOptions,
} from "@/app/actions/workspaces";
import { LinkEntityPicker } from "@/components/link-entity-picker";
import { Modal } from "@/components/modal";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button, Input, Select } from "@/components/ui";
import { externalAssignees, memberAssignees } from "@/lib/task-assignees";
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
  workspaceType,
  boardMemberUsers,
  externalCandidateUsers,
  currentUserId,
}: {
  task: TaskWithRelations | null;
  columns: { id: string; name: string }[];
  users: UserOption[];
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  workspaceType?: TaskWorkspaceType;
  boardMemberUsers?: UserOption[];
  externalCandidateUsers?: UserOption[];
  currentUserId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedExternal, setSelectedExternal] = useState<string[]>([]);
  const [resolvedMembers, setResolvedMembers] = useState<UserOption[]>([]);
  const [resolvedExternal, setResolvedExternal] = useState<UserOption[]>([]);
  const [, attachAction, attachPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => attachExternalLink(formData),
    {}
  );

  const isSharedBoard = workspaceType === TaskWorkspaceType.SHARED;
  const memberOptions = boardMemberUsers ?? resolvedMembers;
  const externalOptions = externalCandidateUsers ?? resolvedExternal;

  useEffect(() => {
    if (task) {
      setSelectedMembers(memberAssignees(task).map((a) => a.userId));
      setSelectedExternal(externalAssignees(task).map((a) => a.userId));
      setError(null);
    }
  }, [task]);

  useEffect(() => {
    if (!task || !isSharedBoard || !canEdit) return;
    if (boardMemberUsers && externalCandidateUsers) return;

    let cancelled = false;
    void Promise.all([
      boardMemberUsers
        ? Promise.resolve(boardMemberUsers)
        : getWorkspaceAssigneeOptions(task.workspaceId),
      externalCandidateUsers
        ? Promise.resolve(externalCandidateUsers)
        : getExternalAssigneeCandidates(task.workspaceId),
    ]).then(([members, external]) => {
      if (cancelled) return;
      if (!boardMemberUsers) setResolvedMembers(members);
      if (!externalCandidateUsers) setResolvedExternal(external);
    });

    return () => {
      cancelled = true;
    };
  }, [
    task?.id,
    task?.workspaceId,
    isSharedBoard,
    canEdit,
    boardMemberUsers,
    externalCandidateUsers,
  ]);

  if (!task) return null;

  const isExternalViewer =
    !!currentUserId &&
    task.assignees.some(
      (a) =>
        a.userId === currentUserId && a.scope === TaskAssigneeScope.EXTERNAL
    ) &&
    !memberOptions.some((u) => u.id === currentUserId);

  const effectiveCanEdit = canEdit && !isExternalViewer;
  const isCompleted = task.status === "COMPLETED";
  const legacyUsers = users.length > 0 ? users : memberOptions;

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateTask(formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleMemberAssignees() {
    startTransition(async () => {
      const result = await setTaskMemberAssignees(task!.id, selectedMembers);
      if (result.error) setError(result.error);
    });
  }

  function handleExternalAssignees() {
    startTransition(async () => {
      const result = await setTaskExternalAssignees(task!.id, selectedExternal);
      if (result.error) setError(result.error);
    });
  }

  function handleLegacyAssignees() {
    startTransition(async () => {
      const result = await setTaskMemberAssignees(task!.id, selectedMembers);
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

  function renderAssigneeCheckboxes(
    options: UserOption[],
    selected: string[],
    onChange: (ids: string[]) => void
  ) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((u) => (
          <label key={u.id} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(u.id)}
              onChange={(e) => {
                onChange(
                  e.target.checked
                    ? [...selected, u.id]
                    : selected.filter((id) => id !== u.id)
                );
              }}
            />
            {u.name ?? u.email}
          </label>
        ))}
      </div>
    );
  }

  function renderReadOnlyAssignees(currentTask: TaskWithRelations) {
    const members = memberAssignees(currentTask);
    const external = externalAssignees(currentTask);
    const all = [...members, ...external];

    if (all.length === 0) {
      return <p className="text-sm text-slate-500">No assignees.</p>;
    }

    return (
      <div className="space-y-3">
        {members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {members.map((a) => (
              <span
                key={a.userId}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
              >
                <UserAvatar
                  userId={a.userId}
                  name={a.user.name}
                  email={a.user.email}
                  size="xs"
                />
                {a.user.name ?? a.user.email}
              </span>
            ))}
          </div>
        )}
        {external.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              External
            </p>
            <div className="flex flex-wrap gap-2">
              {external.map((a) => (
                <span
                  key={a.userId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
                >
                  <UserAvatar
                    userId={a.userId}
                    name={a.user.name}
                    email={a.user.email}
                    size="xs"
                  />
                  {a.user.name ?? a.user.email}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={task.title} wide>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {isExternalViewer && (
        <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          This task was shared with you directly. You can view it here but not the
          full board.
        </p>
      )}

      {effectiveCanEdit ? (
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

      <div className="mt-6 border-t border-slate-200 pt-4">
        {isSharedBoard ? (
          <>
            <p className="mb-2 text-sm font-medium text-slate-700">Assignees</p>
            <p className="mb-3 text-xs text-slate-500">
              Board members who own this task on the shared board.
            </p>
            {effectiveCanEdit ? (
              <>
                {renderAssigneeCheckboxes(
                  memberOptions,
                  selectedMembers,
                  setSelectedMembers
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2"
                  onClick={handleMemberAssignees}
                  disabled={pending}
                >
                  Update assignees
                </Button>
              </>
            ) : memberAssignees(task).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memberAssignees(task).map((a) => (
                  <span
                    key={a.userId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    <UserAvatar
                      userId={a.userId}
                      name={a.user.name}
                      email={a.user.email}
                      size="xs"
                    />
                    {a.user.name ?? a.user.email}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No assignees.</p>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Assign external assignee
              </p>
              <p className="mb-3 text-xs text-slate-500">
                People outside this board who can view and work on this task only.
              </p>
              {effectiveCanEdit ? (
                <>
                  {externalOptions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No external users available.
                    </p>
                  ) : (
                    renderAssigneeCheckboxes(
                      externalOptions,
                      selectedExternal,
                      setSelectedExternal
                    )
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2"
                    onClick={handleExternalAssignees}
                    disabled={pending}
                  >
                    Update external assignees
                  </Button>
                </>
              ) : (
                externalAssignees(task).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {externalAssignees(task).map((a) => (
                      <span
                        key={a.userId}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
                      >
                        <UserAvatar
                          userId={a.userId}
                          name={a.user.name}
                          email={a.user.email}
                          size="xs"
                        />
                        {a.user.name ?? a.user.email}
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        ) : effectiveCanEdit ? (
          <>
            <p className="mb-2 text-sm font-medium text-slate-700">Assignees</p>
            {renderAssigneeCheckboxes(legacyUsers, selectedMembers, setSelectedMembers)}
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={handleLegacyAssignees}
              disabled={pending}
            >
              Update assignees
            </Button>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium text-slate-700">Assignees</p>
            {renderReadOnlyAssignees(task)}
          </>
        )}
      </div>

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
              {effectiveCanEdit && (
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
        {effectiveCanEdit && (
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
