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
  const role = (formData.get("role") as string)?.trim() as TaskWorkspaceRole;

  if (!workspaceId || !email) {
    return { error: "Workspace and email are required." };
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

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) return { error: "No user found with that email." };

  const validRole =
    role === TaskWorkspaceRole.EDITOR ? TaskWorkspaceRole.EDITOR : TaskWorkspaceRole.VIEWER;

  await prisma.taskWorkspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId, userId: invitee.id },
    },
    create: {
      workspaceId,
      userId: invitee.id,
      role: validRole,
    },
    update: { role: validRole },
  });

  revalidatePath(`/boards/${workspaceId}`);
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
  return {};
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
