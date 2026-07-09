export const TASKS_CARD_ID = process.env.TASKS_TOOL_CARD_ID ?? "seed-tasks-tool";

export const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"] as const;

export const PRIORITY_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export type TaskPriorityValue = (typeof PRIORITY_OPTIONS)[number]["value"];

export const PRIORITY_META: Record<
  TaskPriorityValue,
  { label: string; border: string; dot: string; badge: string }
> = {
  NONE: {
    label: "None",
    border: "border-l-slate-200",
    dot: "bg-slate-300",
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
  },
  LOW: {
    label: "Low",
    border: "border-l-sky-400",
    dot: "bg-sky-400",
    badge: "bg-sky-100 text-sky-800 ring-sky-200",
  },
  MEDIUM: {
    label: "Medium",
    border: "border-l-amber-400",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
  },
  HIGH: {
    label: "High",
    border: "border-l-orange-500",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-900 ring-orange-200",
  },
  URGENT: {
    label: "Urgent",
    border: "border-l-red-500",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-800 ring-red-200",
  },
};

export const LINKED_APP_OPTIONS = [
  { value: "SALES", label: "Sales — Deal" },
  { value: "FACTORY", label: "Factory — Batch" },
  { value: "RP", label: "RP — Request" },
  { value: "ASSEMBLY", label: "Assembly" },
] as const;
