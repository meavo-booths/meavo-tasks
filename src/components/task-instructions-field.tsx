"use client";

import { useState } from "react";
import {
  TaskAttachmentsDisplay,
  TaskAttachmentsSection,
} from "@/components/task-attachments";
import type { TaskWithRelations } from "@/lib/domain/task-queries";

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
  const details = useTaskDetails(defaultValue);
  const hasUrls = /https?:\/\//.test(details.value);

  return (
    <div className="space-y-3">
      <TaskDetailsToggle {...details.toggleProps} />
      {!details.open && details.hasContent && (
        <input type="hidden" name="description" value={details.value} />
      )}
      {details.open && (
        <div
          className={
            compact
              ? "w-full space-y-2"
              : "w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
          }
        >
          {!compact && (
            <div>
              <p className="text-sm font-medium text-slate-700">Detailed instructions</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Optional — steps, context, or notes for completing this task.
              </p>
            </div>
          )}
          {hasUrls && (
            <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2">
              <p className="mb-1 text-xs font-medium text-slate-500">Links in this task</p>
              <LinkifiedText text={details.value} />
            </div>
          )}
          <TaskDetailsTextarea
            value={details.value}
            onChange={details.setValue}
            rows={rows}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

export function useTaskDetails(defaultValue = "", attachmentCount = 0) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const hasContent = value.trim().length > 0 || attachmentCount > 0;

  return {
    open,
    setOpen,
    value,
    setValue,
    hasContent,
    toggleProps: {
      open,
      hasContent,
      onClick: () => setOpen((current) => !current),
    },
  };
}

export function TaskDetailsToggle({
  open,
  hasContent,
  onClick,
  className = "",
}: {
  open: boolean;
  hasContent: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
        open || hasContent
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
      } ${className}`}
    >
      {hasContent ? "Detailed instructions" : "Add detailed instructions"}
    </button>
  );
}

export function TaskDetailsTextarea({
  value,
  onChange,
  rows = 5,
  panel = false,
  name = "description",
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  panel?: boolean;
  name?: string;
  autoFocus?: boolean;
}) {
  const field = (
    <textarea
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      placeholder="Add notes, steps, links, or extra context…"
      className={textareaClassName}
      autoFocus={autoFocus}
    />
  );

  if (!panel) return field;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-2 text-xs text-slate-500">
        Optional notes and context for this task.
      </p>
      {field}
    </div>
  );
}

export function TaskDetailsPanel({
  taskId,
  description,
  onDescriptionChange,
  attachments,
  canEdit,
  rows = 6,
}: {
  taskId: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  attachments: TaskWithRelations["attachments"];
  canEdit: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <TaskDetailsTextarea
        value={description}
        onChange={onDescriptionChange}
        rows={rows}
      />
      <TaskAttachmentsSection taskId={taskId} attachments={attachments} canEdit={canEdit} />
    </div>
  );
}

export function TaskDetailsDisplay({
  description,
  attachments,
}: {
  description: string;
  attachments: TaskWithRelations["attachments"];
}) {
  const hasDescription = description.trim().length > 0;
  const hasAttachments = attachments.length > 0;

  if (!hasDescription && !hasAttachments) return null;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-sm font-medium text-slate-700">Details</p>
      {hasDescription && <LinkifiedText text={description} />}
      <TaskAttachmentsDisplay attachments={attachments} />
    </div>
  );
}

// Backwards-compatible aliases
export const useCollapsibleDescription = useTaskDetails;
export const TaskDescriptionToggle = TaskDetailsToggle;
export const TaskDescriptionTextarea = TaskDetailsTextarea;
export const TaskInstructionsDisplay = TaskDetailsDisplay;
