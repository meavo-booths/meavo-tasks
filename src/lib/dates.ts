import { isBefore, isSameDay, startOfDay } from "date-fns";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

export type DueDateGroup = "overdue" | "today" | "upcoming" | "no_date";

export function groupTasksByDueDate(tasks: TaskWithRelations[]) {
  const today = startOfDay(new Date());
  const groups: Record<DueDateGroup, TaskWithRelations[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    no_date: [],
  };

  for (const task of tasks) {
    if (!task?.dueDate) {
      groups.no_date.push(task);
      continue;
    }
    const due = startOfDay(task.dueDate);
    if (isBefore(due, today)) {
      groups.overdue.push(task);
    } else if (isSameDay(due, today)) {
      groups.today.push(task);
    } else {
      groups.upcoming.push(task);
    }
  }

  return groups;
}

export const DUE_GROUP_LABELS: Record<DueDateGroup, string> = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  no_date: "No date",
};

import { PRIORITY_META } from "@/lib/tasks-config";

export const PRIORITY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(PRIORITY_META).map(([key, meta]) => [key, meta.border])
);

export const PRIORITY_DOT_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(PRIORITY_META).map(([key, meta]) => [key, meta.dot])
);
