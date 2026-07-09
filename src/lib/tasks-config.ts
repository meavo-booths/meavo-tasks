export const TASKS_CARD_ID = process.env.TASKS_TOOL_CARD_ID ?? "seed-tasks-tool";

export const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Done"] as const;

export const PRIORITY_OPTIONS = [
  { value: "NONE", label: "None" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export const LINKED_APP_OPTIONS = [
  { value: "SALES", label: "Sales — Deal" },
  { value: "FACTORY", label: "Factory — Batch" },
  { value: "RP", label: "RP — Request" },
  { value: "ASSEMBLY", label: "Assembly" },
] as const;
