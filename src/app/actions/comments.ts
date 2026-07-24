"use server";

import { revalidatePath } from "next/cache";

import { getTasksUser } from "@/lib/access";
import { getTaskAccess } from "@/lib/domain/task-authz";
import {
  createRootTaskComment,
  createTaskCommentReply,
  deleteTaskCommentRecord,
  getTaskCommentById,
  listTaskCommentThreads,
  resolveRootTaskComment,
  unresolveRootTaskComment,
  type TaskCommentThread,
} from "@/lib/domain/task-comments";
import { getTaskById } from "@/lib/domain/task-queries";

export type ActionResult = { error?: string };

function revalidateTaskPaths(workspaceId: string) {
  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${workspaceId}`);
  revalidatePath(`/boards/${workspaceId}/list`);
}

function normalizeBody(body: string | undefined | null) {
  return (body ?? "").trim();
}

export async function listTaskComments(taskId: string): Promise<{
  error?: string;
  comments?: TaskCommentThread[];
  currentUserId?: string;
  canEditTask?: boolean;
}> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const taskAccess = await getTaskAccess(
    access.user.id,
    taskId,
    access.user.systemRole
  );
  if (!taskAccess.canView) {
    return { error: "You do not have permission to view comments on this task." };
  }

  const comments = await listTaskCommentThreads(taskId);
  return {
    comments,
    currentUserId: access.user.id,
    canEditTask: taskAccess.canEdit,
  };
}

export async function createTaskComment(
  taskId: string,
  body: string
): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const text = normalizeBody(body);
  if (!text) return { error: "Comment cannot be empty." };

  const task = await getTaskById(taskId);
  if (!task) return { error: "Task not found." };

  const taskAccess = await getTaskAccess(
    access.user.id,
    taskId,
    access.user.systemRole
  );
  if (!taskAccess.canView) {
    return { error: "You do not have permission to comment on this task." };
  }

  await createRootTaskComment({
    taskId,
    authorId: access.user.id,
    body: text,
  });

  revalidateTaskPaths(task.workspaceId);
  return {};
}

export async function replyToTaskComment(
  parentId: string,
  body: string
): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const text = normalizeBody(body);
  if (!text) return { error: "Reply cannot be empty." };

  const parent = await getTaskCommentById(parentId);
  if (!parent) return { error: "Comment not found." };
  if (parent.parentId !== null) {
    return { error: "Replies can only be added to top-level comments." };
  }

  const task = await getTaskById(parent.taskId);
  if (!task) return { error: "Task not found." };

  const taskAccess = await getTaskAccess(
    access.user.id,
    parent.taskId,
    access.user.systemRole
  );
  if (!taskAccess.canView) {
    return { error: "You do not have permission to reply on this task." };
  }

  await createTaskCommentReply({
    taskId: parent.taskId,
    authorId: access.user.id,
    parentId: parent.id,
    body: text,
  });

  revalidateTaskPaths(task.workspaceId);
  return {};
}

export async function resolveTaskComment(commentId: string): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const comment = await getTaskCommentById(commentId);
  if (!comment) return { error: "Comment not found." };
  if (comment.parentId !== null) {
    return { error: "Only top-level comments can be resolved." };
  }

  const task = await getTaskById(comment.taskId);
  if (!task) return { error: "Task not found." };

  const taskAccess = await getTaskAccess(
    access.user.id,
    comment.taskId,
    access.user.systemRole
  );
  const canResolve = taskAccess.canEdit || comment.authorId === access.user.id;
  if (!canResolve) {
    return { error: "You do not have permission to resolve this comment." };
  }

  await resolveRootTaskComment({
    commentId: comment.id,
    resolvedById: access.user.id,
  });

  revalidateTaskPaths(task.workspaceId);
  return {};
}

export async function unresolveTaskComment(commentId: string): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const comment = await getTaskCommentById(commentId);
  if (!comment) return { error: "Comment not found." };
  if (comment.parentId !== null) {
    return { error: "Only top-level comments can be unresolved." };
  }

  const task = await getTaskById(comment.taskId);
  if (!task) return { error: "Task not found." };

  const taskAccess = await getTaskAccess(
    access.user.id,
    comment.taskId,
    access.user.systemRole
  );
  const canResolve = taskAccess.canEdit || comment.authorId === access.user.id;
  if (!canResolve) {
    return { error: "You do not have permission to unresolve this comment." };
  }

  await unresolveRootTaskComment(comment.id);

  revalidateTaskPaths(task.workspaceId);
  return {};
}

export async function deleteTaskComment(commentId: string): Promise<ActionResult> {
  const access = await getTasksUser();
  if (!access.ok) return { error: access.error };

  const comment = await getTaskCommentById(commentId);
  if (!comment) return { error: "Comment not found." };

  const task = await getTaskById(comment.taskId);
  if (!task) return { error: "Task not found." };

  const taskAccess = await getTaskAccess(
    access.user.id,
    comment.taskId,
    access.user.systemRole
  );
  const canDelete = taskAccess.canEdit || comment.authorId === access.user.id;
  if (!canDelete) {
    return { error: "You do not have permission to delete this comment." };
  }

  await deleteTaskCommentRecord(comment.id);

  revalidateTaskPaths(task.workspaceId);
  return {};
}
