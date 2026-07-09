import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TASKS_CARD_ID } from "@/lib/tasks-config";

export type TasksSessionUser = NonNullable<Session["user"]> & { id: string };

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";
export const TASKS_ACCESS_REVOKED_MESSAGE =
  "You no longer have access to Tasks. Ask your admin to grant access on meavo.app.";

export type TasksUserResult =
  | { ok: true; user: TasksSessionUser }
  | { ok: false; error: string };

export async function getTasksUser(): Promise<TasksUserResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: SESSION_EXPIRED_MESSAGE };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { systemRole: true },
  });
  if (!user) {
    return { ok: false, error: SESSION_EXPIRED_MESSAGE };
  }
  if (user.systemRole === "ADMIN") {
    return { ok: true, user: session.user as TasksSessionUser };
  }

  const access = await prisma.toolCardAccess.findUnique({
    where: {
      userId_cardId: { userId: session.user.id, cardId: TASKS_CARD_ID },
    },
  });
  if (!access) {
    return { ok: false, error: TASKS_ACCESS_REVOKED_MESSAGE };
  }

  return { ok: true, user: session.user as TasksSessionUser };
}

export async function requireTasksUser(): Promise<TasksSessionUser> {
  const result = await getTasksUser();
  if (!result.ok) {
    throw new Error(
      result.error === TASKS_ACCESS_REVOKED_MESSAGE ? "Forbidden" : "Unauthorized"
    );
  }
  return result.user;
}
