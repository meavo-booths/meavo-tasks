"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/app/actions/tasks";
import { AssigneePicker } from "@/components/assignee-picker";
import { TaskInstructionsField } from "@/components/task-instructions-field";
import { IconCalendar, IconFlag, IconPlus } from "@/components/icons";
import { Button } from "@/components/ui";
import { PRIORITY_META, PRIORITY_OPTIONS, type TaskPriorityValue } from "@/lib/tasks-config";

type ActionResult = { error?: string; taskId?: string };
type UserOption = { id: string; name: string | null; email: string };

export function CreateLinkedTaskForm({
  workspaceId,
  linkedApp,
  entityId,
  defaultTitle,
  entityLabel,
  assigneeOptions,
  currentUserId,
}: {
  workspaceId: string;
  linkedApp: string;
  entityId: string;
  defaultTitle?: string;
  entityLabel: string;
  assigneeOptions?: UserOption[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createTask(formData),
    {}
  );
  const [priority, setPriority] = useState<TaskPriorityValue>("NONE");
  const showAssignees = assigneeOptions && assigneeOptions.length > 1;

  useEffect(() => {
    if (state.taskId) {
      router.push(`/?task=${encodeURIComponent(state.taskId)}`);
      router.refresh();
    }
  }, [state.taskId, router]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="linkedApp" value={linkedApp} />
      <input type="hidden" name="entityId" value={entityId} />

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Linked to
          </span>
          <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-800">
            {entityLabel}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <IconPlus size={16} />
            </span>
            <input
              name="title"
              defaultValue={defaultTitle}
              placeholder="What needs to be done?"
              required
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-sm"
            />
          </div>
          <Button type="submit" disabled={pending} size="sm" className="w-full shrink-0 sm:w-auto">
            {pending ? "Adding…" : "Add task"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <IconFlag size={14} />
            Priority
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITY_OPTIONS.filter((p) => p.value !== "NONE").map((option) => {
              const meta = PRIORITY_META[option.value];
              const active = priority === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(active ? "NONE" : option.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    active ? meta.badge : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <label className="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 sm:ml-auto sm:w-auto">
            <IconCalendar size={14} />
            <input
              name="dueDate"
              type="date"
              className="border-0 bg-transparent p-0 text-xs focus:outline-none focus:ring-0"
            />
          </label>

          {showAssignees && (
            <AssigneePicker users={assigneeOptions} currentUserId={currentUserId} />
          )}

          <div className="w-full">
            <TaskInstructionsField compact rows={4} />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
