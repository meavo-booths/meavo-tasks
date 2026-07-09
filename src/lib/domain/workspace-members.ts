import { TaskWorkspaceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
