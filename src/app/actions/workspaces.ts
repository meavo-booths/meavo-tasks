"use server";

import { revalidatePath } from "next/cache";
import { TaskWorkspaceRole, TaskWorkspaceType } from "@prisma/client";
import { getTasksUser } from "@/lib/access";
import { requireWorkspaceEdit } from "@/lib/domain/task-authz";
import {
  createWorkspaceWithColumns,
  ensurePersonalWorkspace,
} from "@/lib/domain/workspace-bootstrap";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error?: string; workspaceId?: string };

async function requireUser() {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error } as const;
  return { user: access.user } as const;
}

export async function bootstrapPersonalWorkspace() {
  const auth = await requireUser();
  if ("error" in auth) return null;
  return ensurePersonalWorkspace(auth.user.id);
}

export async function createTeamBoard(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const teamId = (formData.get("teamId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  if (!teamId || !name) return { error: "Team and name are required." };

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: auth.user.id, teamId } },
    include: { team: true },
  });
  if (!membership) {
    return { error: "You are not a member of this team." };
  }

  const existing = await prisma.taskWorkspace.findFirst({
    where: { type: TaskWorkspaceType.TEAM, teamId },
  });
  if (existing) {
    return { error: "A board already exists for this team." };
  }

  const workspace = await createWorkspaceWithColumns({
    type: TaskWorkspaceType.TEAM,
    name,
    ownerId: auth.user.id,
    teamId,
    color: membership.team.color,
  });

  revalidatePath("/boards");
  return { workspaceId: workspace.id };
}

export async function createSharedBoard(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required." };

  const workspace = await createWorkspaceWithColumns({
    type: TaskWorkspaceType.SHARED,
    name,
    ownerId: auth.user.id,
  });

  revalidatePath("/boards");
  return { workspaceId: workspace.id };
}

export async function inviteWorkspaceMember(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const workspaceId = (formData.get("workspaceId") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const userId = (formData.get("userId") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() as TaskWorkspaceRole;

  if (!workspaceId || (!email && !userId)) {
    return { error: "Select a team member or enter an email." };
  }

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "Only the board owner can invite members." };
  }

  const workspace = await prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    select: { type: true, ownerId: true },
  });
  if (!workspace || workspace.type !== TaskWorkspaceType.SHARED) {
    return { error: "Members can only be invited to shared boards." };
  }
  if (workspace.ownerId !== auth.user.id && auth.user.systemRole !== "ADMIN") {
    return { error: "Only the board owner can invite members." };
  }

  let inviteeId = userId;
  if (inviteeId) {
    const colleague = await prisma.teamMember.findFirst({
      where: {
        userId: auth.user.id,
        team: { members: { some: { userId: inviteeId } } },
      },
      select: { id: true },
    });
    if (!colleague) {
      return { error: "You can only invite people from your teams." };
    }
  } else {
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return { error: "No user found with that email." };
    inviteeId = invitee.id;
  }

  if (inviteeId === workspace.ownerId) {
    return { error: "The board owner already has access." };
  }

  const validRole =
    role === TaskWorkspaceRole.EDITOR ? TaskWorkspaceRole.EDITOR : TaskWorkspaceRole.VIEWER;

  await prisma.taskWorkspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId, userId: inviteeId },
    },
    create: {
      workspaceId,
      userId: inviteeId,
      role: validRole,
    },
    update: { role: validRole },
  });

  revalidatePath(`/boards/${workspaceId}`);
  revalidatePath(`/boards/${workspaceId}/list`);
  revalidatePath("/boards");
  return {};
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const workspace = await prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace || workspace.ownerId !== auth.user.id) {
    return { error: "Only the board owner can remove members." };
  }

  await prisma.taskWorkspaceMember.deleteMany({
    where: { workspaceId, userId },
  });

  revalidatePath(`/boards/${workspaceId}`);
  revalidatePath(`/boards/${workspaceId}/list`);
  return {};
}

export type WorkspaceInviteCandidate = {
  id: string;
  name: string | null;
  email: string;
  teamName: string;
};

export async function getWorkspaceInviteCandidates(workspaceId: string) {
  const auth = await requireUser();
  if ("error" in auth) return [];

  const workspace = await prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    select: {
      type: true,
      ownerId: true,
      members: { select: { userId: true } },
    },
  });
  if (!workspace || workspace.type !== TaskWorkspaceType.SHARED) return [];
  if (workspace.ownerId !== auth.user.id && auth.user.systemRole !== "ADMIN") {
    return [];
  }

  const existingIds = new Set([
    workspace.ownerId,
    ...workspace.members.map((m) => m.userId),
  ]);

  const teamMemberships = await prisma.teamMember.findMany({
    where: { userId: auth.user.id },
    include: {
      team: {
        select: {
          name: true,
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  const candidates = new Map<string, WorkspaceInviteCandidate>();
  for (const membership of teamMemberships) {
    for (const member of membership.team.members) {
      if (existingIds.has(member.userId) || member.userId === auth.user.id) {
        continue;
      }
      const existing = candidates.get(member.userId);
      if (existing) {
        if (!existing.teamName.includes(membership.team.name)) {
          existing.teamName = `${existing.teamName}, ${membership.team.name}`;
        }
        continue;
      }
      candidates.set(member.userId, {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        teamName: membership.team.name,
      });
    }
  }

  return [...candidates.values()].sort((a, b) =>
    (a.name ?? a.email).localeCompare(b.name ?? b.email)
  );
}

export async function getUserTeams() {
  const auth = await requireUser();
  if ("error" in auth) return [];

  return prisma.teamMember.findMany({
    where: { userId: auth.user.id },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          color: true,
          taskWorkspaces: {
            where: { type: TaskWorkspaceType.TEAM },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { team: { name: "asc" } },
  });
}

export async function getAllUsers() {
  const auth = await requireUser();
  if ("error" in auth) return [];

  return prisma.user.findMany({
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });
}

export async function getWorkspaceAssigneeOptions(workspaceId: string) {
  const auth = await requireUser();
  if ("error" in auth) return [];

  const workspace = await prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      team: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!workspace) return [];

  const users = new Map<string, { id: string; name: string | null; email: string }>();
  const addUser = (user: { id: string; name: string | null; email: string }) => {
    users.set(user.id, user);
  };

  addUser(workspace.owner);

  if (workspace.type === TaskWorkspaceType.SHARED) {
    for (const member of workspace.members) {
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

export async function getExternalAssigneeCandidates(workspaceId: string) {
  const auth = await requireUser();
  if ("error" in auth) return [];

  const [boardMembers, allUsers] = await Promise.all([
    getWorkspaceAssigneeOptions(workspaceId),
    getAllUsers(),
  ]);
  const boardIds = new Set(boardMembers.map((u) => u.id));
  return allUsers.filter((user) => !boardIds.has(user.id));
}
