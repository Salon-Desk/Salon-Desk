"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

export interface ConfirmDialogProps {
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

/** Shared confirmation prompt for every delete / suspend / revoke action. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      onClose={onClose}
      title={title}
      size="sm"
      className={destructive ? "border-rose-200" : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            className={
              destructive
                ? "border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
                : undefined
            }
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-slate-600 text-xs leading-relaxed">{description}</p>
      {children}
    </Modal>
  );
}
