export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-28 rounded-2xl bg-slate-200" />
      <div className="space-y-2">
        <div className="h-14 rounded-xl bg-slate-200" />
        <div className="h-14 rounded-xl bg-slate-200" />
        <div className="h-14 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
