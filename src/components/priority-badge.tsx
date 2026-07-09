import { PRIORITY_META, type TaskPriorityValue } from "@/lib/tasks-config";

export function PriorityBadge({
  priority,
  compact = false,
}: {
  priority: string;
  compact?: boolean;
}) {
  const meta = PRIORITY_META[priority as TaskPriorityValue];
  if (!meta || priority === "NONE") return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md font-medium ring-1 ring-inset ${meta.badge} ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
    >
      {meta.label}
    </span>
  );
}
