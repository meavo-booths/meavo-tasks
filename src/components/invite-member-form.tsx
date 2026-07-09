"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  inviteWorkspaceMember,
  removeWorkspaceMember,
  type WorkspaceInviteCandidate,
} from "@/app/actions/workspaces";
import { IconUsers } from "@/components/icons";
import { Modal } from "@/components/modal";
import { Button, Input, Select } from "@/components/ui";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string | null; email: string };
};

type InviteMode = "team" | "email";

export function InviteMemberForm({
  workspaceId,
  members,
  teamCandidates,
}: {
  workspaceId: string;
  members: Member[];
  teamCandidates: WorkspaceInviteCandidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InviteMode>(
    teamCandidates.length > 0 ? "team" : "email"
  );
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const wasPending = useRef(false);
  const [removing, startRemove] = useTransition();
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) =>
      inviteWorkspaceMember(formData),
    {}
  );

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setInviteSuccess(true);
      router.refresh();
      const form = document.getElementById("invite-member-form") as HTMLFormElement | null;
      form?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error, router]);

  function handleClose() {
    setOpen(false);
    setRemoveError(null);
    setInviteSuccess(false);
  }

  function handleOpen() {
    setInviteSuccess(false);
    setOpen(true);
  }

  function handleRemove(userId: string) {
    setRemoveError(null);
    startRemove(async () => {
      const result = await removeWorkspaceMember(workspaceId, userId);
      if (result.error) setRemoveError(result.error);
      else router.refresh();
    });
  }

  const roleOptions = [
    { value: "EDITOR", label: "Editor — can add and edit tasks" },
    { value: "VIEWER", label: "Viewer — can view only" },
  ];

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={handleOpen}>
        <IconUsers size={14} />
        Invite
      </Button>

      <Modal open={open} onClose={handleClose} title="Share with people">
        <div className="mb-4 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMode("team")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "team"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Team member
          </button>
          <button
            type="button"
            onClick={() => setMode("email")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "email"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Email
          </button>
        </div>

        <form id="invite-member-form" action={action} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />

          {mode === "team" ? (
            teamCandidates.length > 0 ? (
              <Select
                label="Team member"
                name="userId"
                required
                options={[
                  { value: "", label: "Choose someone from your teams" },
                  ...teamCandidates.map((candidate) => ({
                    value: candidate.id,
                    label: `${candidate.name ?? candidate.email} · ${candidate.teamName}`,
                  })),
                ]}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No team colleagues available to invite. Switch to Email to invite by
                address.
              </p>
            )
          ) : (
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="colleague@meavo.com"
              autoComplete="email"
            />
          )}

          <Select label="Role" name="role" defaultValue="EDITOR" options={roleOptions} />

          <Button
            type="submit"
            disabled={pending || (mode === "team" && teamCandidates.length === 0)}
            className="w-full sm:w-auto"
          >
            {pending ? "Inviting…" : "Send invite"}
          </Button>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {inviteSuccess && !state.error && (
            <p className="text-sm text-emerald-700">Invite sent.</p>
          )}
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-medium text-slate-900">
            People with access
            {members.length > 0 && (
              <span className="ml-1.5 font-normal text-slate-500">({members.length})</span>
            )}
          </h3>

          {removeError && <p className="mt-2 text-sm text-red-600">{removeError}</p>}

          {members.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No one else has been invited yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {member.user.name ?? member.user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs capitalize text-slate-500">
                      {member.role.toLowerCase()}
                    </span>
                    <button
                      type="button"
                      disabled={removing}
                      onClick={() => handleRemove(member.userId)}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
