"use client";

import { useState, useTransition } from "react";
import { searchEntities } from "@/app/actions/links";
import { LINKED_APP_OPTIONS } from "@/lib/tasks-config";

export function LinkEntityPicker({ disabled }: { disabled?: boolean }) {
  const [linkedApp, setLinkedApp] = useState<string>(LINKED_APP_OPTIONS[0].value);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; label: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      const rows = await searchEntities(linkedApp, query);
      setResults(rows);
      setSelectedId(rows[0]?.id ?? "");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <select
          name="linkedApp"
          value={linkedApp}
          onChange={(e) => setLinkedApp(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          {LINKED_APP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={pending || disabled}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          Search
        </button>
      </div>
      {results.length > 0 && (
        <select
          name="entityId"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          {results.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      )}
      {selectedId && (
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-700"
        >
          Attach link
        </button>
      )}
    </div>
  );
}
