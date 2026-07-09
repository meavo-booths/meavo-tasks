import { TaskAssigneeScope } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

export function memberAssignees(task: TaskWithRelations) {
  return task.assignees.filter(
    (a) => a.scope === TaskAssigneeScope.MEMBER || !("scope" in a)
  );
}

export function externalAssignees(task: TaskWithRelations) {
  return task.assignees.filter((a) => a.scope === TaskAssigneeScope.EXTERNAL);
}

export function allAssigneeUsers(task: TaskWithRelations) {
  return task.assignees.map((a) => ({
    userId: a.userId,
    name: a.user.name,
    email: a.user.email,
    scope: a.scope,
  }));
}
