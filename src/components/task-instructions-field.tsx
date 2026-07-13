const textareaClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function isUrl(part: string): boolean {
  return /^https?:\/\//.test(part);
}

export function LinkifiedText({
  text,
  className = "whitespace-pre-wrap text-sm leading-relaxed text-slate-600",
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(URL_PATTERN);

  return (
    <p className={className}>
      {parts.map((part, index) =>
        isUrl(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 underline hover:text-brand-800"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
}

export function TaskInstructionsField({
  defaultValue = "",
  rows = 6,
  compact = false,
}: {
  defaultValue?: string;
  rows?: number;
  compact?: boolean;
}) {
  const hasUrls = /https?:\/\//.test(defaultValue);

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
      {hasUrls && (
        <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2">
          <p className="mb-1 text-xs font-medium text-slate-500">Links in this task</p>
          <LinkifiedText text={defaultValue} />
        </div>
      )}
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

export function TaskInstructionsDisplay({ instructions }: { instructions: string }) {
  if (!instructions.trim()) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">Detailed instructions</p>
      <LinkifiedText text={instructions} />
    </div>
  );
}
