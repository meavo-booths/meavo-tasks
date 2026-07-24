import { prisma } from "@/lib/prisma";

const authorSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const commentInclude = {
  author: { select: authorSelect },
  resolvedBy: { select: authorSelect },
  replies: {
    include: {
      author: { select: authorSelect },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export type TaskCommentAuthor = {
  id: string;
  name: string | null;
  email: string;
};

export type TaskCommentReply = {
  id: string;
  taskId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  resolvedAt: Date | null;
  resolvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: TaskCommentAuthor;
};

export type TaskCommentThread = {
  id: string;
  taskId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  resolvedAt: Date | null;
  resolvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: TaskCommentAuthor;
  resolvedBy: TaskCommentAuthor | null;
  replies: TaskCommentReply[];
};

export async function listTaskCommentThreads(
  taskId: string
): Promise<TaskCommentThread[]> {
  return prisma.taskComment.findMany({
    where: { taskId, parentId: null },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function getTaskCommentById(commentId: string) {
  return prisma.taskComment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: authorSelect },
      parent: { select: { id: true, parentId: true, taskId: true, authorId: true } },
    },
  });
}

export async function createRootTaskComment(input: {
  taskId: string;
  authorId: string;
  body: string;
}) {
  return prisma.taskComment.create({
    data: {
      taskId: input.taskId,
      authorId: input.authorId,
      body: input.body,
    },
    include: commentInclude,
  });
}

export async function createTaskCommentReply(input: {
  taskId: string;
  authorId: string;
  parentId: string;
  body: string;
}) {
  return prisma.taskComment.create({
    data: {
      taskId: input.taskId,
      authorId: input.authorId,
      parentId: input.parentId,
      body: input.body,
    },
    include: {
      author: { select: authorSelect },
    },
  });
}

export async function resolveRootTaskComment(input: {
  commentId: string;
  resolvedById: string;
}) {
  return prisma.taskComment.update({
    where: { id: input.commentId },
    data: {
      resolvedAt: new Date(),
      resolvedById: input.resolvedById,
    },
  });
}

export async function unresolveRootTaskComment(commentId: string) {
  return prisma.taskComment.update({
    where: { id: commentId },
    data: {
      resolvedAt: null,
      resolvedById: null,
    },
  });
}

export async function deleteTaskCommentRecord(commentId: string) {
  await prisma.taskComment.delete({ where: { id: commentId } });
}
