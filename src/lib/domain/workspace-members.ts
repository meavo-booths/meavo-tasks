import { TaskWorkspaceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WorkspaceUserOption = { id: string; name: string | null; email: string };

export function collectWorkspaceAssigneeOptions(workspace: {
  type: TaskWorkspaceType;
  owner: WorkspaceUserOption;
  members?: { user: WorkspaceUserOption }[];
  team?: { members: { user: WorkspaceUserOption }[] } | null;
}): WorkspaceUserOption[] {
  const users = new Map<string, WorkspaceUserOption>();
  const addUser = (user: WorkspaceUserOption) => users.set(user.id, user);

  addUser(workspace.owner);

  if (workspace.type === TaskWorkspaceType.SHARED) {
    for (const member of workspace.members ?? []) {
      addUser(member.user);
    }
  }

  if (workspace.type === TaskWorkspaceType.TEAM && workspace.team) {
    for (const member of workspace.team.members) {
      addUser(member.user);
    }
  }

  if (workspace.type === TaskWorkspaceType.PERSONAL) {
    return [workspace.owner];
  }

  return [...users.values()].sort((a, b) =>
    (a.name ?? a.email).localeCompare(b.name ?? b.email)
  );
}

export async function getWorkspaceBoardMemberIds(workspaceId: string) {
  const workspace = await prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: { select: { userId: true } },
      team: {
        include: {
          members: { select: { userId: true } },
        },
      },
    },
  });
  if (!workspace) return new Set<string>();

  const ids = new Set<string>([workspace.ownerId]);

  if (workspace.type === TaskWorkspaceType.SHARED) {
    for (const member of workspace.members) {
      ids.add(member.userId);
    }
  }

  if (workspace.type === TaskWorkspaceType.TEAM && workspace.team) {
    for (const member of workspace.team.members) {
      ids.add(member.userId);
    }
  }

  return ids;
}
