import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "@inertiajs/react";
import { Building2, FileText } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Textarea from "@/Components/common/Modern/Textarea";

import { X } from "lucide-react";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

const workspaceSchema = (t: any) =>
  z.object({
    name: z
      .string()
      .min(1, t("workspace.invite_modal.validation.nameRequired"))
      .max(255),
    description: z.string().max(1000).optional().or(z.literal("")),
  });

type WorkspaceFormData = z.infer<ReturnType<typeof workspaceSchema>>;

const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  t,
}: CreateWorkspaceModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema(t)),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: WorkspaceFormData) => {
    setIsSubmitting(true);
    router.post(route("workspaces.store"), data, {
      onSuccess: () => {
        onClose();
        reset();
        toast.success(t("workspace.messages.update_success"));
        setIsSubmitting(false);
      },
      onError: (errors) => {
        setIsSubmitting(false);
        if (errors) {
          Object.keys(errors).forEach((key) => {
            setError(key as any, {
              type: "server",
              message: errors[key],
            });
          });
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("workspace.create_new_workspace")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
                {t("workspace.modal.subtitle")}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            variant="ghost"
            buttonStyle="outline"
            icon={X}
          ></Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            id="name"
            label={t("workspace.name")}
            required
            sizeType="lg"
            register={register}
            error={errors.name?.message}
            placeholder={t("workspace.name_placeholder")}
            autoFocus
          />

          <div className="space-y-1">
            <Textarea
              id="description"
              label={t("workspace.description")}
              register={register}
              name="description"
              placeholder={t("workspace.description_placeholder")}
              error={errors.description?.message as string}
              icon={FileText}
              variant="filled"
              size="lg"
              rows={4}
              maxLength={200}
              showCharCount
              hint="Maximum 200 characters"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              buttonStyle="outline"
              fullWidth
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              fullWidth
              buttonStyle="gradient"
            >
              {isSubmitting ? t("common.creating") : t("workspace.create")}
            </Button>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-neutral-800">
            <p className="text-xs text-gray-500 dark:text-neutral-500 text-center">
              {t("workspace.modal.footer_note")}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
