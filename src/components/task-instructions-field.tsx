const textareaClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function TaskInstructionsField({
  defaultValue = "",
  rows = 6,
  compact = false,
}: {
  defaultValue?: string;
  rows?: number;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "space-y-2"
          : "rounded-xl border border-slate-200 bg-slate-50/60 p-4"
      }
    >
      <div className={compact ? "" : "mb-3"}>
        <p className="text-sm font-medium text-slate-700">Detailed instructions</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Optional — steps, context, or notes for completing this task.
        </p>
      </div>
      <textarea
        name="description"
        defaultValue={defaultValue}
        rows={rows}
        placeholder="Add step-by-step instructions, links, or extra context…"
        className={textareaClassName}
      />
    </div>
  );
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function isUrl(part: string): boolean {
  return /^https?:\/\//.test(part);
}

export function TaskInstructionsDisplay({ instructions }: { instructions: string }) {
  if (!instructions.trim()) return null;

  const parts = instructions.split(URL_PATTERN);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">Detailed instructions</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
        {parts.map((part, index) =>
          isUrl(part) ? (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 underline hover:text-brand-800"
            >
              {part}
            </a>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </p>
    </div>
  );
}
