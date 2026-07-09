"use client";

import { useState } from "react";
import { IconUsers } from "@/components/icons";
import { AssigneeChipPicker } from "@/components/assignee-chip-picker";
import { Button } from "@/components/ui";

type UserOption = { id: string; name: string | null; email: string };

export function AssigneePicker({
  users,
  currentUserId,
  name = "assigneeIds",
}: {
  users: UserOption[];
  currentUserId?: string;
  name?: string;
}) {
  const [selected, setSelected] = useState<string[]>(
    currentUserId ? [currentUserId] : []
  );
  const [open, setOpen] = useState(false);

  if (users.length <= 1) {
    return currentUserId ? (
      <input type="hidden" name={name} value={currentUserId} />
    ) : null;
  }

  return (
    <div className="w-full sm:w-auto">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        className="w-full gap-1.5 sm:w-auto"
      >
        <IconUsers size={14} />
        Assign to
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {selected.length}
        </span>
      </Button>

      {open && (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <AssigneeChipPicker users={users} selected={selected} onChange={setSelected} />
        </div>
      )}

      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
