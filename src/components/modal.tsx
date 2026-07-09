"use client";

import { ReactNode, useEffect, useRef } from "react";
import { IconX } from "@/components/icons";

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
      className={`fixed inset-0 z-50 m-auto w-[calc(100%-1.5rem)] max-h-[90vh] rounded-2xl border border-slate-200 bg-white p-0 shadow-modal backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm ${wide ? "max-w-2xl" : "max-w-lg"}`}
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 id="modal-title" className="pr-4 text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <IconX size={18} />
        </button>
      </div>
      <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto px-5 py-5">{children}</div>
    </dialog>
  );
}
