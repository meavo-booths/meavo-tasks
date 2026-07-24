"use client";

import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState, useTransition, type ReactNode } from "react";

import {
  createTaskComment,
  deleteTaskComment,
  listTaskComments,
  replyToTaskComment,
  resolveTaskComment,
  unresolveTaskComment,
} from "@/app/actions/comments";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui";
import type {
  TaskCommentReply,
  TaskCommentThread,
} from "@/lib/domain/task-comments";

function displayName(user: { name: string | null; email: string }) {
  return user.name?.trim() || user.email;
}

function CommentTimestamp({ date }: { date: Date | string }) {
  const value = typeof date === "string" ? new Date(date) : date;
  const absolute = format(value, "d MMM yyyy · HH:mm");
  const relative = formatDistanceToNow(value, { addSuffix: true });
  return (
    <time dateTime={value.toISOString()} title={absolute} className="text-xs text-slate-500">
      {relative}
      <span className="hidden sm:inline"> · {absolute}</span>
    </time>
  );
}

function CommentBody({
  author,
  body,
  createdAt,
  muted,
  actions,
}: {
  author: { id: string; name: string | null; email: string };
  body: string;
  createdAt: Date | string;
  muted?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className={`flex gap-2 ${muted ? "opacity-70" : ""}`}>
      <UserAvatar
        userId={author.id}
        name={author.name}
        email={author.email}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-slate-800">
            {displayName(author)}
          </span>
          <CommentTimestamp date={createdAt} />
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
          {body}
        </p>
        {actions ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function TaskComments({ taskId }: { taskId: string }) {
  const [threads, setThreads] = useState<TaskCommentThread[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canEditTask, setCanEditTask] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [pending, startTransition] = useTransition();

  async function refresh() {
    const result = await listTaskComments(taskId);
    if (result.error) {
      setError(result.error);
      setThreads([]);
      return;
    }
    setError(null);
    setThreads(result.comments ?? []);
    setCurrentUserId(result.currentUserId ?? null);
    setCanEditTask(result.canEditTask ?? false);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDraft("");
    setReplyingTo(null);
    setReplyDraft("");
    setShowResolved(false);
    void (async () => {
      const result = await listTaskComments(taskId);
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        setThreads([]);
      } else {
        setError(null);
        setThreads(result.comments ?? []);
        setCurrentUserId(result.currentUserId ?? null);
        setCanEditTask(result.canEditTask ?? false);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  function canResolve(thread: TaskCommentThread) {
    if (!currentUserId) return false;
    return canEditTask || thread.authorId === currentUserId;
  }

  function canDeleteComment(authorId: string) {
    if (!currentUserId) return false;
    return canEditTask || authorId === currentUserId;
  }

  function run(action: () => Promise<{ error?: string }>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onSuccess?.();
      await refresh();
    });
  }

  const unresolved = threads.filter((t) => !t.resolvedAt);
  const resolved = threads.filter((t) => !!t.resolvedAt);
  const visible = showResolved ? threads : unresolved;

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">Comments</p>
        {resolved.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {showResolved
              ? "Hide resolved"
              : `Show resolved (${resolved.length})`}
          </button>
        ) : null}
      </div>

      {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : (
        <div className="space-y-4">
          {visible.length === 0 ? (
            <p className="text-sm text-slate-500">
              {threads.length === 0
                ? "No comments yet. Start the discussion."
                : "No open comments. Show resolved to review closed threads."}
            </p>
          ) : (
            visible.map((thread) => {
              const muted = !!thread.resolvedAt;
              return (
                <div
                  key={thread.id}
                  className={`rounded-lg border p-3 ${
                    muted
                      ? "border-slate-100 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <CommentBody
                    author={thread.author}
                    body={thread.body}
                    createdAt={thread.createdAt}
                    muted={muted}
                    actions={
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setReplyingTo(
                              replyingTo === thread.id ? null : thread.id
                            );
                            setReplyDraft("");
                          }}
                          className="!min-h-0 !px-2 !py-1"
                        >
                          Reply
                        </Button>
                        {canResolve(thread) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(() =>
                                thread.resolvedAt
                                  ? unresolveTaskComment(thread.id)
                                  : resolveTaskComment(thread.id)
                              )
                            }
                            className="!min-h-0 !px-2 !py-1"
                          >
                            {thread.resolvedAt ? "Unresolve" : "Resolve"}
                          </Button>
                        ) : null}
                        {canDeleteComment(thread.authorId) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(() => deleteTaskComment(thread.id), () => {
                                if (replyingTo === thread.id) {
                                  setReplyingTo(null);
                                  setReplyDraft("");
                                }
                              })
                            }
                            className="!min-h-0 !px-2 !py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        ) : null}
                        {thread.resolvedAt ? (
                          <span className="text-xs text-slate-500">Resolved</span>
                        ) : null}
                      </>
                    }
                  />

                  {thread.replies.length > 0 ? (
                    <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-3 ml-3">
                      {thread.replies.map((reply: TaskCommentReply) => (
                        <CommentBody
                          key={reply.id}
                          author={reply.author}
                          body={reply.body}
                          createdAt={reply.createdAt}
                          muted={muted}
                          actions={
                            canDeleteComment(reply.authorId) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                onClick={() =>
                                  run(() => deleteTaskComment(reply.id))
                                }
                                className="!min-h-0 !px-2 !py-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            ) : null
                          }
                        />
                      ))}
                    </div>
                  ) : null}

                  {replyingTo === thread.id ? (
                    <div className="mt-3 ml-3 space-y-2 border-l-2 border-brand-100 pl-3">
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        rows={2}
                        placeholder="Write a reply…"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        disabled={pending}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending || !replyDraft.trim()}
                          onClick={() =>
                            run(
                              () => replyToTaskComment(thread.id, replyDraft),
                              () => {
                                setReplyingTo(null);
                                setReplyDraft("");
                              }
                            )
                          }
                        >
                          Post reply
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyDraft("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          disabled={pending || loading}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={pending || loading || !draft.trim()}
            onClick={() =>
              run(
                () => createTaskComment(taskId, draft),
                () => setDraft("")
              )
            }
          >
            Post comment
          </Button>
        </div>
      </div>
    </div>
  );
}
