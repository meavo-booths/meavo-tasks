"use server";

import { revalidatePath } from "next/cache";
import { TaskAssigneeScope, TaskLinkedApp, TaskStatus } from "@prisma/client";
import { getTasksUser } from "@/lib/access";
import {
  createTaskExternalLink,
  parseLinkedApp,
} from "@/lib/integrations/external-link";
import { resolveExternalLink } from "@/lib/integrations/link-resolver";
import { formatLinkedEntityDescription } from "@/lib/integrations/linked-description";
import { requireWorkspaceEdit } from "@/lib/domain/task-authz";
import {
  canAccessTask,
  getTaskById,
  parseOptionalDate,
  parsePriority,
} from "@/lib/domain/task-queries";
import { getDefaultColumnId } from "@/lib/domain/workspace-bootstrap";
import { getWorkspaceBoardMemberIds } from "@/lib/domain/workspace-members";
import {
  getExternalAssigneeCandidates,
  getWorkspaceAssigneeOptions,
} from "@/app/actions/workspaces";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import { prisma } from "@/lib/prisma";

export type ActionResult = { error?: string; taskId?: string };

async function requireUser() {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error } as const;
  return { user: access.user } as const;
}

/** Fire-and-forget "task assigned" notifications, skipping self-assignment. */
function notifyTaskAssigned(
  taskId: string,
  assigneeUserIds: string[],
  assignedByUserId: string
) {
  // Timestamped key: re-assigning after removal should notify again, while
  // still deduplicating retries of the same action call.
  const occurredAt = Date.now();
  for (const assigneeUserId of assigneeUserIds) {
    if (assigneeUserId === assignedByUserId) continue;
    void enqueueNotification({
      sourceApp: "tasks",
      eventType: "tasks.task.assigned",
      idempotencyKey: `tasks:assigned:${taskId}:${assigneeUserId}:${occurredAt}`,
      payload: { taskId, assigneeUserId, assignedByUserId },
    }).catch((error) => {
      console.error("Notification enqueue failed:", error);
    });
  }
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

  const linkedAppRaw = (formData.get("linkedApp") as string)?.trim();
  const entityIdRaw = (formData.get("entityId") as string)?.trim();
  const wantsLink = Boolean(linkedAppRaw || entityIdRaw);

  let linkedApp: TaskLinkedApp | null = null;
  let entityId: string | null = null;
  let resolvedLink: Awaited<ReturnType<typeof resolveExternalLink>> = null;

  if (wantsLink) {
    linkedApp = linkedAppRaw ? parseLinkedApp(linkedAppRaw) : null;
    entityId = entityIdRaw || null;
    if (!linkedApp || !entityId) {
      return { error: "Linked app and entity are required." };
    }
    resolvedLink = await resolveExternalLink(linkedApp, entityId);
    if (!resolvedLink) return { error: "Entity not found." };
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

  const userDescription = (formData.get("description") as string)?.trim() ?? "";
  const description =
    resolvedLink && linkedApp
      ? formatLinkedEntityDescription(resolvedLink, linkedApp, userDescription)
      : userDescription;

  const task = await prisma.task.create({
    data: {
      workspaceId,
      columnId,
      title,
      description,
      priority,
      dueDate,
      createdById: auth.user.id,
      position: (maxPosition._max.position ?? -1) + 1,
      assignees: {
        create: assigneeIds.map((userId) => ({
          userId,
          scope: TaskAssigneeScope.MEMBER,
        })),
      },
    },
  });

  notifyTaskAssigned(task.id, assigneeIds, auth.user.id);

  if (linkedApp && entityId) {
    const linkResult = await createTaskExternalLink(
      task.id,
      linkedApp,
      entityId,
      resolvedLink
    );
    if (linkResult.error) {
      await prisma.task.delete({ where: { id: task.id } });
      return { error: linkResult.error };
    }
  }

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

export async function setTaskMemberAssignees(
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

  const boardMemberIds = await getWorkspaceBoardMemberIds(task.workspaceId);
  const uniqueIds = [...new Set(userIds.filter((id) => boardMemberIds.has(id)))];
  const previousAssigneeIds = new Set(task.assignees.map((a) => a.userId));

  await prisma.$transaction([
    prisma.taskAssignee.deleteMany({
      where: { taskId, scope: TaskAssigneeScope.MEMBER },
    }),
    ...(uniqueIds.length > 0
      ? [
          prisma.taskAssignee.createMany({
            data: uniqueIds.map((userId) => ({
              taskId,
              userId,
              scope: TaskAssigneeScope.MEMBER,
            })),
          }),
        ]
      : []),
  ]);

  notifyTaskAssigned(
    taskId,
    uniqueIds.filter((id) => !previousAssigneeIds.has(id)),
    auth.user.id
  );

  revalidatePath("/");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
}

export async function setTaskExternalAssignees(
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

  const boardMemberIds = await getWorkspaceBoardMemberIds(task.workspaceId);
  const uniqueIds = [
    ...new Set(userIds.filter((id) => id && !boardMemberIds.has(id))),
  ];
  const previousAssigneeIds = new Set(task.assignees.map((a) => a.userId));

  await prisma.$transaction([
    prisma.taskAssignee.deleteMany({
      where: { taskId, scope: TaskAssigneeScope.EXTERNAL },
    }),
    ...(uniqueIds.length > 0
      ? [
          prisma.taskAssignee.createMany({
            data: uniqueIds.map((userId) => ({
              taskId,
              userId,
              scope: TaskAssigneeScope.EXTERNAL,
            })),
          }),
        ]
      : []),
  ]);

  notifyTaskAssigned(
    taskId,
    uniqueIds.filter((id) => !previousAssigneeIds.has(id)),
    auth.user.id
  );

  revalidatePath("/");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
}

/** @deprecated Use setTaskMemberAssignees / setTaskExternalAssignees */
export async function setTaskAssignees(
  taskId: string,
  userIds: string[]
): Promise<ActionResult> {
  return setTaskMemberAssignees(taskId, userIds);
}

export async function addTaskAssignee(
  taskId: string,
  userId: string,
  scope: TaskAssigneeScope = TaskAssigneeScope.MEMBER
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

  const boardMemberIds = await getWorkspaceBoardMemberIds(task.workspaceId);
  if (scope === TaskAssigneeScope.MEMBER && !boardMemberIds.has(userId)) {
    return { error: "Only board members can be assigned as owners." };
  }
  if (scope === TaskAssigneeScope.EXTERNAL && boardMemberIds.has(userId)) {
    return { error: "Board members should be assigned as owners, not external." };
  }

  const existing = task.assignees.find((a) => a.userId === userId);
  if (existing?.scope === scope) return {};

  await prisma.taskAssignee.upsert({
    where: {
      taskId_userId: { taskId, userId },
    },
    create: { taskId, userId, scope },
    update: { scope },
  });

  // Only a brand-new assignment notifies; a scope change does not.
  if (!existing) {
    notifyTaskAssigned(taskId, [userId], auth.user.id);
  }

  revalidatePath("/");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
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

  await prisma.taskAssignee.deleteMany({ where: { taskId, userId } });

  revalidatePath("/");
  revalidatePath(`/boards/${task.workspaceId}`);
  revalidatePath(`/boards/${task.workspaceId}/list`);
  return {};
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
