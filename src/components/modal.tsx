"use client";

import { ReactNode, useEffect, useRef } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] rounded-xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40 ${wide ? "max-w-2xl" : "max-w-lg"}`}
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
        <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
    </dialog>
  );
}
