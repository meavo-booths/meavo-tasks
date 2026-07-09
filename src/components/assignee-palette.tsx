"use client";

import { useState } from "react";
import { ASSIGNEE_DRAG_TYPE, IconUsers } from "@/components/icons";
import { UserAvatar } from "@/components/user-avatar";
import { userLabel } from "@/lib/user-display";
import { Button } from "@/components/ui";

type UserOption = { id: string; name: string | null; email: string };

export function AssigneePalette({
  users,
}: {
  users: UserOption[];
}) {
  const [open, setOpen] = useState(false);

  if (users.length <= 1) return null;

  return (
    <div className="mb-4">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        className="gap-1.5"
      >
        <IconUsers size={14} />
        People
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {users.length}
        </span>
      </Button>

      {open && (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs text-slate-500">
            Drag someone onto a task to assign them as owner.
          </p>
          <div className="flex flex-wrap gap-2">
            {users.map((user) => (
              <div
                key={user.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(ASSIGNEE_DRAG_TYPE, user.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex cursor-grab items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 active:cursor-grabbing"
              >
                <UserAvatar userId={user.id} name={user.name} email={user.email} size="xs" />
                {userLabel(user.name, user.email)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
