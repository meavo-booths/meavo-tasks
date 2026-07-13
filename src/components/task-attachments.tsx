"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteTaskAttachment, uploadTaskAttachment } from "@/app/actions/attachments";
import { IconPlus } from "@/components/icons";
import { formatFileSize } from "@/lib/format-file-size";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

type TaskAttachment = TaskWithRelations["attachments"][number];

export function TaskAttachmentsSection({
  taskId,
  attachments,
  canEdit,
}: {
  taskId: string;
  attachments: TaskAttachment[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUpload(file: File) {
    const formData = new FormData();
    formData.set("taskId", taskId);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadTaskAttachment(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  function handleDelete(attachmentId: string) {
    startTransition(async () => {
      const result = await deleteTaskAttachment(attachmentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">Attachments</p>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleUpload(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <IconPlus size={12} />
              Attach file
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {attachments.length === 0 ? (
        <p className="text-xs text-slate-500">No files attached.</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
            >
              <a
                href={`/api/tasks/attachments/${attachment.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                {attachment.fileName}
              </a>
              <span className="shrink-0 text-[10px] text-slate-400">
                {formatFileSize(attachment.byteSize)}
              </span>
              {canEdit && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(attachment.id)}
                  className="shrink-0 text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Remove ${attachment.fileName}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TaskAttachmentsDisplay({
  attachments,
}: {
  attachments: TaskAttachment[];
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">Attachments</p>
      <ul className="space-y-1.5">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a
              href={`/api/tasks/attachments/${attachment.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              <span className="truncate">{attachment.fileName}</span>
              <span className="shrink-0 text-[10px] font-normal text-slate-400">
                {formatFileSize(attachment.byteSize)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
