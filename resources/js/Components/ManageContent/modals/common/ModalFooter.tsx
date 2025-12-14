import Button from "@/Components/common/Modern/Button";
import { Save, X } from "lucide-react";
import React from "react";

interface ModalFooterProps {
  isSubmitting?: boolean;
  onClose?: () => void;
  submitText?: string;
  cancelText?: string;
  formId?: string;
  submitIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  submitVariant?:
    | "primary"
    | "danger"
    | "secondary"
    | "success"
    | "ghost"
    | "warning";
  cancelVariant?:
    | "primary"
    | "danger"
    | "secondary"
    | "success"
    | "ghost"
    | "warning";
  submitStyle?: "solid" | "outline" | "gradient" | "ghost";
  cancelStyle?: "solid" | "outline" | "gradient" | "ghost";
}

export default function ModalFooter({
  isSubmitting = false,
  onClose,
  submitText = "Save",
  cancelText = "Cancel",
  formId,
  submitIcon = <Save className="w-4 h-4" />,
  cancelIcon = <X className="w-4 h-4" />,
  submitVariant = "primary",
  cancelVariant = "secondary",
  submitStyle = "gradient",
  cancelStyle = "outline",
}: ModalFooterProps) {
  
  return (
    <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
      {onClose && (
        <Button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          variant={cancelVariant}
          style={cancelStyle}
          size="md"
          icon={cancelIcon}
        >
          {cancelText}
        </Button>
      )}

      <Button
        type={formId ? "submit" : "button"}
        form={formId}
        disabled={isSubmitting}
        loading={isSubmitting}
        variant={submitVariant}
        style={submitStyle}
        size="md"
        icon={submitIcon}
      >
        {submitText}
      </Button>
    </div>
  );
}
