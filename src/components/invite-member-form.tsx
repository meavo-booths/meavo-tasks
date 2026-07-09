"use client";

import { useActionState } from "react";
import { inviteWorkspaceMember, removeWorkspaceMember } from "@/app/actions/workspaces";
import { Button, Card, Input, Select } from "@/components/ui";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
};

export function InviteMemberForm({
  workspaceId,
  members,
}: {
  workspaceId: string;
  members: Member[];
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) =>
      inviteWorkspaceMember(formData),
    {}
  );

  return (
    <Card className="mb-6">
      <h2 className="text-sm font-semibold text-slate-900">Share with people</h2>
      <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <div className="min-w-[200px] flex-1">
          <Input label="Email" name="email" type="email" required placeholder="colleague@meavo.com" />
        </div>
        <Select
          label="Role"
          name="role"
          defaultValue="EDITOR"
          options={[
            { value: "EDITOR", label: "Editor" },
            { value: "VIEWER", label: "Viewer" },
          ]}
        />
        <Button type="submit" disabled={pending}>
          Invite
        </Button>
      </form>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      {members.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span>
                {m.user.name ?? m.user.email}{" "}
                <span className="text-slate-400">({m.role.toLowerCase()})</span>
              </span>
              <button
                type="button"
                onClick={() => void removeWorkspaceMember(workspaceId, m.userId)}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
