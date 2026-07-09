"use client";

import { useActionState } from "react";
import { createTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui";
import { PRIORITY_OPTIONS } from "@/lib/tasks-config";

type ActionResult = { error?: string; taskId?: string };

export function QuickAddTask({
  workspaceId,
  columnId,
}: {
  workspaceId: string;
  columnId?: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createTask(formData),
    {}
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {columnId && <input type="hidden" name="columnId" value={columnId} />}
      <div className="min-w-0 flex-1">
        <input
          name="title"
          placeholder="Add a task…"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <select
        name="priority"
        defaultValue="NONE"
        className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        name="dueDate"
        type="date"
        className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
      />
      <Button type="submit" disabled={pending}>
        Add
      </Button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
