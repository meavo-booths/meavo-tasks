"use server";

import { revalidatePath } from "next/cache";
import { TaskStatus } from "@prisma/client";
import { getTasksUser } from "@/lib/access";
import { requireWorkspaceEdit } from "@/lib/domain/task-authz";
import {
  canAccessTask,
  getTaskById,
  parseOptionalDate,
  parsePriority,
} from "@/lib/domain/task-queries";
import { getDefaultColumnId } from "@/lib/domain/workspace-bootstrap";
import { getWorkspaceAssigneeOptions } from "@/app/actions/workspaces";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error?: string; taskId?: string };

async function requireUser() {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error } as const;
  return { user: access.user } as const;
}

export async function createTask(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const workspaceId = (formData.get("workspaceId") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  if (!workspaceId || !title) return { error: "Title is required." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to add tasks here." };
  }

  const columnId =
    (formData.get("columnId") as string)?.trim() ||
    (await getDefaultColumnId(workspaceId));
  const dueDate = parseOptionalDate(formData.get("dueDate") as string);
  const priority = parsePriority(formData.get("priority") as string);

  const maxPosition = await prisma.task.aggregate({
    where: { workspaceId, columnId: columnId ?? undefined },
    _max: { position: true },
  });

  const workspace = await prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    select: { type: true },
  });

  const requestedAssignees = [
    ...new Set(
      formData
        .getAll("assigneeIds")
        .map((value) => String(value).trim())
        .filter(Boolean)
    ),
  ];

  let assigneeIds = requestedAssignees;
  if (assigneeIds.length === 0) {
    assigneeIds = [auth.user.id];
  }

  if (
    workspace &&
    workspace.type !== "PERSONAL" &&
    requestedAssignees.length > 0
  ) {
    const allowed = await getWorkspaceAssigneeOptions(workspaceId);
    const allowedIds = new Set(allowed.map((u) => u.id));
    assigneeIds = assigneeIds.filter((id) => allowedIds.has(id));
    if (assigneeIds.length === 0) {
      return { error: "Select at least one valid assignee." };
    }
  }

  const task = await prisma.task.create({
    data: {
      workspaceId,
      columnId,
      title,
      description: (formData.get("description") as string)?.trim() ?? "",
      priority,
      dueDate,
      createdById: auth.user.id,
      position: (maxPosition._max.position ?? -1) + 1,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${workspaceId}`);
  revalidatePath(`/boards/${workspaceId}/list`);
  return { taskId: task.id };
}

export async function updateTask(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const taskId = (formData.get("taskId") as string)?.trim();
  if (!taskId) return { error: "Task is required." };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to edit this task." };
  }

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required." };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: (formData.get("description") as string)?.trim() ?? "",
      priority: parsePriority(formData.get("priority") as string),
      dueDate: parseOptionalDate(formData.get("dueDate") as string),
      startDate: parseOptionalDate(formData.get("startDate") as string),
      columnId: (formData.get("columnId") as string)?.trim() || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
}

export async function completeTask(taskId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to complete this task." };
  }

  const doneColumn = await prisma.taskBoardColumn.findFirst({
    where: { workspaceId: task.workspaceId, name: "Done" },
    select: { id: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      columnId: doneColumn?.id ?? task.columnId,
    },
  });

  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
}

export async function reopenTask(taskId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to reopen this task." };
  }

  const todoColumn = await prisma.taskBoardColumn.findFirst({
    where: { workspaceId: task.workspaceId, name: "To Do" },
    select: { id: true },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.OPEN,
      completedAt: null,
      columnId: todoColumn?.id ?? task.columnId,
    },
  });

  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to delete this task." };
  }

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
}

export async function moveTask(input: {
  taskId: string;
  columnId: string;
  position: number;
}): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const task = await getTaskById(input.taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to move this task." };
  }

  await prisma.task.update({
    where: { id: input.taskId },
    data: {
      columnId: input.columnId,
      position: input.position,
    },
  });

  revalidatePath(`/boards/${task.workspaceId}`);
  return {};
}

export async function setTaskAssignees(
  taskId: string,
  userIds: string[]
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to assign this task." };
  }

  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  await prisma.$transaction([
    prisma.taskAssignee.deleteMany({ where: { taskId } }),
    ...(uniqueIds.length > 0
      ? [
          prisma.taskAssignee.createMany({
            data: uniqueIds.map((userId) => ({ taskId, userId })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
}

export async function addTaskAssignee(
  taskId: string,
  userId: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to assign this task." };
  }

  const existing = task.assignees.map((a) => a.userId);
  if (existing.includes(userId)) return {};

  return setTaskAssignees(taskId, [...existing, userId]);
}

export async function removeTaskAssignee(
  taskId: string,
  userId: string
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { error: auth.error };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  try {
    await requireWorkspaceEdit(
      auth.user.id,
      task.workspaceId,
      auth.user.systemRole
    );
  } catch {
    return { error: "You do not have permission to assign this task." };
  }

  const existing = task.assignees.map((a) => a.userId);
  return setTaskAssignees(
    taskId,
    existing.filter((id) => id !== userId)
  );
}

export async function getTaskForModal(taskId: string) {
  const auth = await requireUser();
  if ("error" in auth) return null;

  const allowed = await canAccessTask(
    auth.user.id,
    taskId,
    auth.user.systemRole
  );
  if (!allowed) return null;

  return getTaskById(taskId);
}
