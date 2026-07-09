import Link from "next/link";

export function ViewSwitcher({
  workspaceId,
  current,
}: {
  workspaceId: string;
  current: "board" | "list";
}) {
  return (
    <nav className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      <Link
        href={`/boards/${workspaceId}`}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          current === "board"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Board
      </Link>
      <Link
        href={`/boards/${workspaceId}/list`}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          current === "list"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        List
      </Link>
    </nav>
  );
}
