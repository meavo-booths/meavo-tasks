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
    <nav className="flex w-full rounded-xl border border-slate-200 bg-slate-100/80 p-1 sm:inline-flex sm:w-auto">
      <Link
        href={`/boards/${workspaceId}`}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:flex-none sm:py-2 ${
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
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition sm:flex-none sm:py-2 ${
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
