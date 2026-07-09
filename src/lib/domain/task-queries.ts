import {
  SystemRole,
  TaskPriority,
  TaskStatus,
  TaskWorkspaceType,
} from "@prisma/client";
import { addDays, isBefore, isSameDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccess } from "@/lib/domain/task-authz";

const UPCOMING_DAYS = 3;

const taskInclude = {
  assignees: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  externalLinks: true,
  column: { select: { id: true, name: true } },
} as const;

export type TaskWithRelations = NonNullable<Awaited<ReturnType<typeof getTaskById>>>;

export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
}

export async function getAccessibleWorkspaces(userId: string, systemRole?: SystemRole) {
  const [owned, teamMemberships, sharedMemberships] = await Promise.all([
    prisma.taskWorkspace.findMany({
      where: { ownerId: userId, archivedAt: null },
      include: {
        team: { select: { id: true, name: true, color: true } },
        _count: { select: { tasks: { where: { status: TaskStatus.OPEN } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    }),
    prisma.taskWorkspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    }),
  ]);

  const teamIds = teamMemberships.map((m) => m.teamId);
  const sharedIds = sharedMemberships.map((m) => m.workspaceId);

  const teamWorkspaces =
    teamIds.length > 0
      ? await prisma.taskWorkspace.findMany({
          where: {
            type: TaskWorkspaceType.TEAM,
            teamId: { in: teamIds },
            archivedAt: null,
            ownerId: { not: userId },
          },
          include: {
            team: { select: { id: true, name: true, color: true } },
            _count: { select: { tasks: { where: { status: TaskStatus.OPEN } } } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : [];

  const sharedWorkspaces =
    sharedIds.length > 0
      ? await prisma.taskWorkspace.findMany({
          where: {
            id: { in: sharedIds },
            archivedAt: null,
            ownerId: { not: userId },
          },
          include: {
            team: { select: { id: true, name: true, color: true } },
            _count: { select: { tasks: { where: { status: TaskStatus.OPEN } } } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : [];

  const seen = new Set<string>();
  const all = [...owned, ...teamWorkspaces, ...sharedWorkspaces].filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });

  if (systemRole === SystemRole.ADMIN) {
    const adminExtra = await prisma.taskWorkspace.findMany({
      where: {
        archivedAt: null,
        id: { notIn: [...seen] },
      },
      include: {
        team: { select: { id: true, name: true, color: true } },
        _count: { select: { tasks: { where: { status: TaskStatus.OPEN } } } },
      },
      take: 50,
      orderBy: { updatedAt: "desc" },
    });
    for (const w of adminExtra) {
      if (!seen.has(w.id)) all.push(w);
    }
  }

  return all;
}

export async function getWorkspaceBoard(workspaceId: string) {
  return prisma.taskWorkspace.findUnique({
    where: { id: workspaceId },
    include: {
      team: { select: { id: true, name: true, color: true } },
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            where: { status: { not: TaskStatus.CANCELLED } },
            orderBy: { position: "asc" },
            include: taskInclude,
          },
        },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });
}

export async function getWorkspaceOpenTasks(workspaceId: string) {
  return prisma.task.findMany({
    where: {
      workspaceId,
      status: TaskStatus.OPEN,
    },
    orderBy: [{ dueDate: "asc" }, { position: "asc" }],
    include: taskInclude,
  });
}

export type BoardDashboardSummary = {
  id: string;
  name: string;
  type: TaskWorkspaceType;
  teamName: string | null;
  teamColor: string | null;
  openCount: number;
  dueTodayCount: number;
  dueSoonCount: number;
  urgentCount: number;
  inProgressCount: number;
  columns: { id: string; name: string }[];
  tasks: TaskWithRelations[];
};

export async function getBoardDashboardSummaries(
  userId: string,
  systemRole?: SystemRole
): Promise<BoardDashboardSummary[]> {
  const workspaces = await getAccessibleWorkspaces(userId, systemRole);
  const boards = workspaces.filter((w) => w.type !== TaskWorkspaceType.PERSONAL);
  if (boards.length === 0) return [];

  const boardIds = boards.map((b) => b.id);
  const [tasks, columns] = await Promise.all([
    prisma.task.findMany({
      where: {
        workspaceId: { in: boardIds },
        status: TaskStatus.OPEN,
      },
      orderBy: [{ dueDate: "asc" }, { position: "asc" }],
      include: {
        ...taskInclude,
        workspace: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.taskBoardColumn.findMany({
      where: { workspaceId: { in: boardIds } },
      orderBy: { position: "asc" },
      select: { id: true, name: true, workspaceId: true },
    }),
  ]);

  const today = startOfDay(new Date());
  const soonEnd = addDays(today, UPCOMING_DAYS);

  return boards.map((board) => {
    const boardTasks = tasks.filter((t) => t.workspaceId === board.id);
    let dueTodayCount = 0;
    let dueSoonCount = 0;
    let urgentCount = 0;
    let inProgressCount = 0;

    for (const task of boardTasks) {
      if (task.priority === TaskPriority.URGENT || task.priority === TaskPriority.HIGH) {
        urgentCount += 1;
      }
      if (task.column?.name === "In Progress") {
        inProgressCount += 1;
      }
      if (!task.dueDate) continue;
      const due = startOfDay(task.dueDate);
      if (isSameDay(due, today)) {
        dueTodayCount += 1;
      } else if (!isBefore(due, today) && !isBefore(soonEnd, due)) {
        dueSoonCount += 1;
      }
    }

    return {
      id: board.id,
      name: board.name,
      type: board.type,
      teamName: board.team?.name ?? null,
      teamColor: board.team?.color ?? null,
      openCount: boardTasks.length,
      dueTodayCount,
      dueSoonCount,
      urgentCount,
      inProgressCount,
      columns: columns
        .filter((col) => col.workspaceId === board.id)
        .map((col) => ({ id: col.id, name: col.name })),
      tasks: boardTasks,
    };
  });
}

export async function getSharedUpcomingTasks(
  userId: string,
  systemRole?: SystemRole
) {
  const workspaces = await getAccessibleWorkspaces(userId, systemRole);
  const boardIds = workspaces
    .filter(
      (w) =>
        w.type === TaskWorkspaceType.TEAM || w.type === TaskWorkspaceType.SHARED
    )
    .map((w) => w.id);

  if (boardIds.length === 0) return [];

  const today = startOfDay(new Date());
  const horizon = addDays(today, UPCOMING_DAYS);

  return prisma.task.findMany({
    where: {
      workspaceId: { in: boardIds },
      status: TaskStatus.OPEN,
      assignees: { some: { userId } },
      dueDate: { gte: today, lte: horizon },
    },
    orderBy: [{ dueDate: "asc" }, { position: "asc" }],
    include: {
      ...taskInclude,
      workspace: { select: { id: true, name: true, type: true } },
    },
  });
}

export async function getPersonalInboxTasks(userId: string) {
  const personal = await prisma.taskWorkspace.findFirst({
    where: { ownerId: userId, type: TaskWorkspaceType.PERSONAL },
    select: { id: true },
  });
  if (!personal) return [];

  return prisma.task.findMany({
    where: {
      workspaceId: personal.id,
      status: TaskStatus.OPEN,
      OR: [
        { createdById: userId },
        { assignees: { some: { userId } } },
      ],
    },
    orderBy: [{ dueDate: "asc" }, { position: "asc" }],
    include: taskInclude,
  });
}

export async function canAccessTask(
  userId: string,
  taskId: string,
  systemRole?: SystemRole
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { workspaceId: true },
  });
  if (!task) return false;
  const access = await getWorkspaceAccess(userId, task.workspaceId, systemRole);
  return access.canView;
}

export function parsePriority(value: string | null): TaskPriority {
  const valid = Object.values(TaskPriority);
  if (value && valid.includes(value as TaskPriority)) {
    return value as TaskPriority;
  }
  return TaskPriority.NONE;
}

export function parseOptionalDate(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
