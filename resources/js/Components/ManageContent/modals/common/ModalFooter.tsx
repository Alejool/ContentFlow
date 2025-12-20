import Button from "@/Components/common/Modern/Button";
import { Save, X } from "lucide-react";
import React from "react";

interface ModalFooterProps {
  isSubmitting?: boolean;
  onClose?: () => void;
  submitText?: string;
  cancelText?: string;
  theme: "dark" | "light";
  formId?: string;
  submitIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;

  // Secondary submit (e.g. Publish)
  showSecondarySubmit?: boolean;
  secondarySubmitText?: string;
  secondarySubmitVariant?: ModalFooterProps["submitVariant"];
  secondarySubmitStyle?: ModalFooterProps["submitStyle"];
  secondarySubmitIcon?: React.ReactNode;
  onSecondarySubmit?: () => void;
  onPrimarySubmit?: () => void;

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
  theme,
  onClose,
  submitText = "Save",
  cancelText = "Cancel",
  formId,
  submitIcon = <Save className="w-4 h-4" />,
  cancelIcon = <X className="w-4 h-4" />,
  showSecondarySubmit = false,
  secondarySubmitText = "Secondary",
  secondarySubmitVariant = "secondary",
  secondarySubmitStyle = "outline",
  secondarySubmitIcon,
  onSecondarySubmit,
  onPrimarySubmit,
  submitVariant = "primary",
  cancelVariant = "secondary",
  submitStyle = "gradient",
  cancelStyle = "outline",
}: ModalFooterProps) {
  const modalHeaderBg =
    theme === "dark"
      ? "bg-gradient-to-r from-neutral-900 to-neutral-800"
      : "bg-gradient-to-r from-gray-50 to-white";
  const modalHeaderBorder =
    theme === "dark" ? "border-neutral-700" : "border-gray-100";

  return (
    <div
      className={`${modalHeaderBg} ${modalHeaderBorder} p-6  border-t border-gray-200 sticky bottom-0  flex justify-end gap-3`}
    >
      {onClose && (
        <Button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          variant={cancelVariant}
          buttonStyle={cancelStyle}
          size="md"
          icon={cancelIcon}
        >
          {cancelText}
        </Button>
      )}

      {showSecondarySubmit && (
        <Button
          type={onSecondarySubmit ? "button" : "submit"}
          form={onSecondarySubmit ? undefined : formId}
          onClick={onSecondarySubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          variant={secondarySubmitVariant || "secondary"}
          buttonStyle={secondarySubmitStyle || "outline"}
          size="md"
          icon={secondarySubmitIcon}
        >
          {secondarySubmitText}
        </Button>
      )}

      <Button
        type={onPrimarySubmit ? "button" : formId ? "submit" : "button"}
        form={onPrimarySubmit ? undefined : formId}
        onClick={onPrimarySubmit}
        disabled={isSubmitting}
        loading={isSubmitting}
        variant={submitVariant}
        buttonStyle={submitStyle}
        size="md"
        icon={submitIcon}
      >
        {submitText}
      </Button>
    </div>
  );
}
