"use client";

import { useState } from "react";
import { IconUsers } from "@/components/icons";
import { UserAvatar } from "@/components/user-avatar";
import { userLabel } from "@/lib/user-display";
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
    <div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        className="gap-1.5"
      >
        <IconUsers size={14} />
        Assign to
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {selected.length}
        </span>
      </Button>

      {open && (
        <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          {users.map((user) => {
            const active = selected.includes(user.id);
            return (
              <label
                key={user.id}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition ${
                  active
                    ? "border-brand-300 bg-white text-slate-900 shadow-sm"
                    : "border-transparent bg-white/70 text-slate-600 hover:border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={(e) => {
                    setSelected((prev) =>
                      e.target.checked
                        ? [...prev, user.id]
                        : prev.filter((id) => id !== user.id)
                    );
                  }}
                />
                <UserAvatar userId={user.id} name={user.name} email={user.email} size="xs" />
                <span className="font-medium">{userLabel(user.name, user.email)}</span>
              </label>
            );
          })}
        </div>
      )}

      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
