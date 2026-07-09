import {
  SystemRole,
  TaskAssigneeScope,
  TaskWorkspaceRole,
  TaskWorkspaceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WorkspaceAccess = {
  canView: boolean;
  canEdit: boolean;
  role: "owner" | "editor" | "viewer" | "team_member" | null;
};

export type TaskAccess = {
  canView: boolean;
  canEdit: boolean;
  isExternalOnly: boolean;
};

export async function getWorkspaceAccess(
  userId: string,
  workspaceId: string,
  systemRole?: SystemRole
): Promise<WorkspaceAccess> {
  const workspace = await prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  });
  if (!workspace) return { canView: false, canEdit: false, role: null };

  if (systemRole === SystemRole.ADMIN) {
    return { canView: true, canEdit: true, role: "owner" };
  }

  if (workspace.ownerId === userId) {
    return { canView: true, canEdit: true, role: "owner" };
  }

  if (workspace.type === TaskWorkspaceType.PERSONAL) {
    return { canView: false, canEdit: false, role: null };
  }

  if (workspace.type === TaskWorkspaceType.TEAM && workspace.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: workspace.teamId } },
    });
    if (member) {
      return { canView: true, canEdit: true, role: "team_member" };
    }
    return { canView: false, canEdit: false, role: null };
  }

  if (workspace.type === TaskWorkspaceType.SHARED) {
    const member = workspace.members.find((m) => m.userId === userId);
    if (member) {
      return {
        canView: true,
        canEdit: member.role === TaskWorkspaceRole.EDITOR,
        role: member.role === TaskWorkspaceRole.EDITOR ? "editor" : "viewer",
      };
    }
    return { canView: false, canEdit: false, role: null };
  }

  return { canView: false, canEdit: false, role: null };
}

export async function getTaskAccess(
  userId: string,
  taskId: string,
  systemRole?: SystemRole
): Promise<TaskAccess> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: {
        where: { userId },
        select: { scope: true },
      },
    },
  });
  if (!task) return { canView: false, canEdit: false, isExternalOnly: false };

  const workspaceAccess = await getWorkspaceAccess(
    userId,
    task.workspaceId,
    systemRole
  );
  if (workspaceAccess.canView) {
    return {
      canView: true,
      canEdit: workspaceAccess.canEdit,
      isExternalOnly: false,
    };
  }

  const external = task.assignees.some(
    (a) => a.scope === TaskAssigneeScope.EXTERNAL
  );
  if (external) {
    return { canView: true, canEdit: false, isExternalOnly: true };
  }

  return { canView: false, canEdit: false, isExternalOnly: false };
}

export async function requireWorkspaceEdit(
  userId: string,
  workspaceId: string,
  systemRole?: SystemRole
) {
  const access = await getWorkspaceAccess(userId, workspaceId, systemRole);
  if (!access.canEdit) throw new Error("Forbidden");
  return access;
}

export async function requireWorkspaceView(
  userId: string,
  workspaceId: string,
  systemRole?: SystemRole
) {
  const access = await getWorkspaceAccess(userId, workspaceId, systemRole);
  if (!access.canView) throw new Error("Forbidden");
  return access;
}

export async function requireTaskEdit(
  userId: string,
  taskId: string,
  systemRole?: SystemRole
) {
  const access = await getTaskAccess(userId, taskId, systemRole);
  if (!access.canEdit) throw new Error("Forbidden");
  return access;
}
