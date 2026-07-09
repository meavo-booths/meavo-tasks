import Link from "next/link";
import { IconBoard, IconList } from "@/components/icons";

export function ViewSwitcher({
  workspaceId,
  current,
}: {
  workspaceId: string;
  current: "board" | "list";
}) {
  return (
    <nav className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
      <Link
        href={`/boards/${workspaceId}`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          current === "board"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <IconBoard size={15} />
        Board
      </Link>
      <Link
        href={`/boards/${workspaceId}/list`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          current === "list"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <IconList size={15} />
        List
      </Link>
    </nav>
  );
}
