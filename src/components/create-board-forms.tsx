"use client";

import { useActionState } from "react";
import { createSharedBoard, createTeamBoard } from "@/app/actions/workspaces";
import { Button, Card, Input, Select } from "@/components/ui";

type TeamOption = {
  team: {
    id: string;
    name: string;
  };
};

export function CreateBoardForms({
  teamsWithoutBoard,
}: {
  teamsWithoutBoard: TeamOption[];
}) {
  const [teamState, teamAction, teamPending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createTeamBoard(formData),
    {}
  );
  const [sharedState, sharedAction, sharedPending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => createSharedBoard(formData),
    {}
  );

  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-2">
      {teamsWithoutBoard.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">New team board</h2>
          <p className="mt-1 text-xs text-slate-500">One board per gateway team.</p>
          <form action={teamAction} className="mt-4 space-y-3">
            <Select
              label="Team"
              name="teamId"
              required
              options={teamsWithoutBoard.map((m) => ({
                value: m.team.id,
                label: m.team.name,
              }))}
            />
            <Input label="Board name" name="name" required placeholder="Sprint board" />
            <Button type="submit" disabled={teamPending}>
              Create team board
            </Button>
            {teamState.error && (
              <p className="text-sm text-red-600">{teamState.error}</p>
            )}
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">New shared board</h2>
        <p className="mt-1 text-xs text-slate-500">Invite members after creating.</p>
        <form action={sharedAction} className="mt-4 space-y-3">
          <Input label="Board name" name="name" required placeholder="Project Alpha" />
          <Button type="submit" disabled={sharedPending}>
            Create shared board
          </Button>
          {sharedState.error && (
            <p className="text-sm text-red-600">{sharedState.error}</p>
          )}
        </form>
      </Card>
    </div>
  );
}
