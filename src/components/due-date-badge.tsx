import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { IconCalendar } from "@/components/icons";

export function DueDateBadge({
  dueDate,
  compact = false,
}: {
  dueDate: Date;
  compact?: boolean;
}) {
  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const isOverdue = isBefore(due, today);
  const isToday = isSameDay(due, today);

  let label = format(dueDate, compact ? "MMM d" : "EEE, MMM d");
  if (isToday) label = "Today";
  if (isOverdue) label = format(dueDate, "MMM d");

  const tone = isOverdue
    ? "bg-red-50 text-red-700 ring-red-200"
    : isToday
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      <IconCalendar size={12} className="opacity-70" />
      {label}
    </span>
  );
}
