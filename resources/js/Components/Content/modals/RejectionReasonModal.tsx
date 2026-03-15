import Button from "@/Components/common/Modern/Button";
import Textarea from "@/Components/common/Modern/Textarea";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  publicationTitle: string;
}

interface RejectionForm {
  reason: string;
}

export default function RejectionReasonModal({
  isOpen,
  onClose,
  onSubmit,
  publicationTitle,
}: RejectionReasonModalProps) {
  const { t } = useTranslation();

  const rejectionSchema = z.object({
    reason: z
      .string()
      .min(10, t("approvals.validation.reasonMin") || "La razón debe tener al menos 10 caracteres")
      .max(500, t("approvals.validation.reasonMax") || "La razón no puede exceder 500 caracteres"),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RejectionForm>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      reason: "",
    },
  });

  const reason = watch("reason", "");

  const onFormSubmit = (data: RejectionForm) => {
    onSubmit(data.reason);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl dark:border dark:border-neutral-700/50 dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-700/50">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
              <AlertCircle className="h-6 w-6 text-red-500" />
              {t("approvals.rejectPublication") || "Rechazar Publicación"}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-neutral-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)}>
            <div className="p-6">
              <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t("approvals.rejectionReasonDescription") ||
                  "Proporciona una razón detallada para el rechazo de"}{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  "{publicationTitle}"
                </span>
                {". "}
                <span className="font-medium text-red-500 dark:text-red-400">
                  {t("common.required") || "Requerido"}
                </span>
              </p>

              <div className="space-y-4">
                <Textarea
                  id="reason"
                  name="reason"
                  label={t("approvals.rejectionReason") || "Razón del Rechazo"}
                  register={register}
                  placeholder={
                    t("approvals.rejectionReasonPlaceholder") ||
                    "Ej. El contenido necesita ajustes en el tono, revisa las imágenes y vuelve a enviar para aprobación..."
                  }
                  maxLength={500}
                  showCharCount
                  rows={5}
                  error={errors.reason?.message}
                  variant="filled"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/30 p-6 dark:border-neutral-700/50 dark:bg-neutral-900/10">
              <Button
                variant="secondary"
                buttonStyle="ghost"
                onClick={handleClose}
                className="px-6"
                rounded="lg"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                variant="danger"
                buttonStyle="gradient"
                loading={isSubmitting}
                className="px-6"
                icon={AlertCircle}
                rounded="lg"
              >
                {t("approvals.reject") || "Rechazar"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
