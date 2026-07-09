"use client";

import { UserAvatar } from "@/components/user-avatar";
import { userLabel } from "@/lib/user-display";

type UserOption = { id: string; name: string | null; email: string };

export function AssigneeChipPicker({
  users,
  selected,
  onChange,
  disabled = false,
  emptyMessage = "No people available.",
}: {
  users: UserOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  if (users.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  function toggle(userId: string) {
    if (disabled) return;
    onChange(
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId]
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {users.map((user) => {
        const active = selected.includes(user.id);
        return (
          <button
            key={user.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(user.id)}
            aria-pressed={active}
            className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition sm:w-auto sm:min-w-[10rem] ${
              active
                ? "border-brand-300 bg-brand-50 text-slate-900 shadow-sm ring-2 ring-brand-100"
                : "border-slate-200 bg-white text-slate-700 active:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <UserAvatar userId={user.id} name={user.name} email={user.email} size="sm" />
            <span className="min-w-0 flex-1 truncate font-medium">
              {userLabel(user.name, user.email)}
            </span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
              aria-hidden
            >
              {active ? "✓" : "+"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
