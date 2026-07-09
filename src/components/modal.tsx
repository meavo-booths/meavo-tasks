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
      className={`modal-sheet ${wide ? "modal-sheet--wide" : "modal-sheet--default"}`}
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="modal-sheet__handle" aria-hidden />
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
        <h2
          id="modal-title"
          className="pr-4 text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="touch-target -mr-1 flex items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <IconX size={18} />
        </button>
      </div>
      <div className="max-h-[calc(92dvh-3.75rem)] overflow-y-auto overscroll-contain px-4 py-4 sm:max-h-[calc(90vh-4.5rem)] sm:px-5 sm:py-5">
        {children}
      </div>
    </dialog>
  );
}
