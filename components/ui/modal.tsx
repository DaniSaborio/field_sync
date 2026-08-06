"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

function Modal({ open, onClose, title, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto border border-black bg-paper shadow-hard sm:max-w-lg",
          className
        )}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-black bg-paper px-4 py-3">
          {title ? (
            <h2 className="truncate font-display text-lg font-black leading-tight tracking-tight text-black">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-8 shrink-0 items-center justify-center border border-black"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export { Modal };
