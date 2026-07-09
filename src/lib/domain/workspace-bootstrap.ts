import { TaskWorkspaceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_COLUMNS } from "@/lib/tasks-config";

export async function ensurePersonalWorkspace(userId: string) {
  let workspace = await prisma.taskWorkspace.findFirst({
    where: { ownerId: userId, type: TaskWorkspaceType.PERSONAL },
    include: { columns: { orderBy: { position: "asc" } } },
  });

  if (!workspace) {
    workspace = await prisma.taskWorkspace.create({
      data: {
        type: TaskWorkspaceType.PERSONAL,
        name: "My Tasks",
        ownerId: userId,
        columns: {
          create: DEFAULT_COLUMNS.map((name, position) => ({ name, position })),
        },
      },
      include: { columns: { orderBy: { position: "asc" } } },
    });
  }

  return workspace;
}

export async function createWorkspaceWithColumns(input: {
  type: TaskWorkspaceType;
  name: string;
  ownerId: string;
  teamId?: string | null;
  color?: string;
}) {
  return prisma.taskWorkspace.create({
    data: {
      type: input.type,
      name: input.name,
      ownerId: input.ownerId,
      teamId: input.teamId ?? null,
      color: input.color,
      columns: {
        create: DEFAULT_COLUMNS.map((name, position) => ({ name, position })),
      },
    },
    include: { columns: { orderBy: { position: "asc" } } },
  });
}

export async function getDefaultColumnId(workspaceId: string) {
  const column = await prisma.taskBoardColumn.findFirst({
    where: { workspaceId, name: "To Do" },
    select: { id: true },
  });
  if (column) return column.id;

  const fallback = await prisma.taskBoardColumn.findFirst({
    where: { workspaceId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  return fallback?.id ?? null;
}
