import ConfirmDialog from "@/Components/ConfirmDialog";
import React, { useState } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger",
  });
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      confirmText: "Confirm",
      cancelText: "Cancel",
      type: "danger",
      ...opts,
    });
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
  };

  const ConfirmDialogComponent = () =>
    React.createElement(ConfirmDialog, {
      isOpen,
      onClose: handleCancel,
      onConfirm: handleConfirm,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      type: options.type,
    });

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
