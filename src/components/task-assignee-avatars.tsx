"use client";

import { IconAlert, IconX } from "@/components/icons";
import { UserAvatar } from "@/components/user-avatar";

type Assignee = {
  userId: string;
  name?: string | null;
  email?: string | null;
};

export function TaskAssigneeAvatars({
  assignees,
  canEdit = false,
  onRemove,
  size = "xs",
  showMissingWarning = true,
  variant = "member",
}: {
  assignees: Assignee[];
  canEdit?: boolean;
  onRemove?: (userId: string) => void;
  size?: "xs" | "sm" | "md";
  showMissingWarning?: boolean;
  variant?: "member" | "external";
}) {
  if (assignees.length === 0) {
    if (!showMissingWarning) return null;
    return (
      <span
        title="No owner assigned"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200"
      >
        <IconAlert size={12} />
      </span>
    );
  }

  return (
    <div className={`flex -space-x-1.5 ${variant === "external" ? "opacity-90" : ""}`}>
      {assignees.map((user) => (
        <div
          key={user.userId}
          className={`group relative ${variant === "external" ? "rounded-full ring-1 ring-dashed ring-slate-300" : ""}`}
        >
          <UserAvatar
            userId={user.userId}
            name={user.name}
            email={user.email}
            size={size}
          />
          {canEdit && onRemove && (
            <button
              type="button"
              title="Remove assignee"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(user.userId);
              }}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm group-hover:flex"
            >
              <IconX size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
