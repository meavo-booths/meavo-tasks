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
import { AssigneeChipPicker } from "@/components/assignee-chip-picker";
import { LinkEntityPicker } from "@/components/link-entity-picker";
import { Modal } from "@/components/modal";
import { PriorityBadge } from "@/components/priority-badge";
import {
  TaskDetailsDisplay,
  TaskDetailsPanel,
  TaskDetailsToggle,
  useTaskDetails,
} from "@/components/task-instructions-field";
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
  const description = useTaskDetails(
    task?.description ?? "",
    task?.attachments.length ?? 0
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedExternal, setSelectedExternal] = useState<string[]>([]);
  const [resolvedMembers, setResolvedMembers] = useState<UserOption[]>([]);
  const [resolvedExternal, setResolvedExternal] = useState<UserOption[]>([]);
  const [, attachAction, attachPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => attachExternalLink(formData),
    {}
  );

  const isSharedBoard = workspaceType === TaskWorkspaceType.SHARED;
  const isBoardWorkspace =
    workspaceType === TaskWorkspaceType.TEAM || workspaceType === TaskWorkspaceType.SHARED;
  const memberOptions = boardMemberUsers ?? resolvedMembers;
  const externalOptions = externalCandidateUsers ?? resolvedExternal;
  const assigneeOptions =
    isBoardWorkspace && memberOptions.length > 0 ? memberOptions : users;

  useEffect(() => {
    if (task) {
      setSelectedMembers(memberAssignees(task).map((a) => a.userId));
      setSelectedExternal(externalAssignees(task).map((a) => a.userId));
      setError(null);
      description.setValue(task.description);
      description.setOpen(false);
    }
  }, [task]);

  useEffect(() => {
    if (!task || !canEdit || !isBoardWorkspace) return;
    if (boardMemberUsers && (!isSharedBoard || externalCandidateUsers)) return;

    let cancelled = false;
    void Promise.all([
      boardMemberUsers
        ? Promise.resolve(boardMemberUsers)
        : getWorkspaceAssigneeOptions(task.workspaceId),
      isSharedBoard && !externalCandidateUsers
        ? getExternalAssigneeCandidates(task.workspaceId)
        : Promise.resolve(externalCandidateUsers ?? []),
    ]).then(([members, external]) => {
      if (cancelled) return;
      if (!boardMemberUsers) setResolvedMembers(members);
      if (isSharedBoard && !externalCandidateUsers) setResolvedExternal(external);
    });

    return () => {
      cancelled = true;
    };
  }, [
    task?.id,
    task?.workspaceId,
    isBoardWorkspace,
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

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateTask(formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function handleMemberChange(ids: string[]) {
    setSelectedMembers(ids);
    startTransition(async () => {
      const result = await setTaskMemberAssignees(task!.id, ids);
      if (result.error) setError(result.error);
      else setError(null);
    });
  }

  function handleExternalChange(ids: string[]) {
    setSelectedExternal(ids);
    startTransition(async () => {
      const result = await setTaskExternalAssignees(task!.id, ids);
      if (result.error) setError(result.error);
      else setError(null);
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

  function renderEditableAssignees(
    options: UserOption[],
    selected: string[],
    onChange: (ids: string[]) => void,
    emptyMessage: string
  ) {
    return (
      <>
        <AssigneeChipPicker
          users={options}
          selected={selected}
          onChange={onChange}
          disabled={pending}
          emptyMessage={emptyMessage}
        />
        <p className="mt-2 text-xs text-slate-500">Tap a person to assign or unassign.</p>
      </>
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
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1">
              <Select
                label="Priority"
                name="priority"
                defaultValue={task.priority}
                options={PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
              />
            </div>
            <TaskDetailsToggle {...description.toggleProps} className="mb-0.5" />
          </div>
          {!description.open && description.hasContent && (
            <input type="hidden" name="description" value={description.value} />
          )}
          {description.open && (
            <TaskDetailsPanel
              taskId={task.id}
              description={description.value}
              onDescriptionChange={description.setValue}
              attachments={task.attachments}
              canEdit={effectiveCanEdit}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={handleComplete} disabled={pending} className="w-full sm:w-auto">
              {isCompleted ? "Reopen" : "Complete"}
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={pending} className="w-full sm:w-auto">
              Delete
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-sm text-slate-600">
          <TaskDetailsDisplay
            description={task.description}
            attachments={task.attachments}
          />
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
              renderEditableAssignees(
                memberOptions,
                selectedMembers,
                handleMemberChange,
                "No board members available."
              )
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
                externalOptions.length === 0 ? (
                  <p className="text-sm text-slate-500">No external users available.</p>
                ) : (
                  renderEditableAssignees(
                    externalOptions,
                    selectedExternal,
                    handleExternalChange,
                    "No external users available."
                  )
                )
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
            {renderEditableAssignees(
              assigneeOptions,
              selectedMembers,
              handleMemberChange,
              "No people available to assign."
            )}
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
