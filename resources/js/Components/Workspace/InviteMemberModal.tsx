import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Modal from "@/Components/common/ui/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Mail, Shield, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: any[];
  workspace: any;
}

const getInviteSchema = (t: any) =>
  z.object({
    email: z.preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z.string().email(t("workspace.invite_modal.validation.email")),
    ),
    role_id: z.number().min(1, t("workspace.invite_modal.validation.role")),
  });

type InviteFormData = {
  email: string;
  role_id: number;
};

export default function InviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
  roles,
  workspace,
}: InviteMemberModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InviteFormData>({
    resolver: zodResolver(getInviteSchema(t)),
    defaultValues: {
      email: "",
      role_id: roles.find((r) => r.slug === "member")?.id || roles[0]?.id,
    },
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Invite Form Errors:", errors);
      console.log("Current Watch Email:", watch("email"));
    }
  }, [errors]);

  const roleOptions = roles
    .filter((role) => role.slug !== "owner")
    .map((role) => ({
      value: role.id,
      label: role.name,
      icon: <Shield className="w-4 h-4" />,
    }));

  const onSubmit = async (data: InviteFormData) => {
    if (!workspace?.id) {
      toast.error(t("workspace.invite_modal.messages.missing_info"));
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        route("api.v1.workspaces.invite", workspace.id),
        data,
      );
      toast.success(
        response.data.message || t("workspace.invite_modal.messages.success"),
      );
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Invite error", error);
      if (error.response?.data?.errors) {
        // Get the first error message from the validation errors object
        const firstErrorField = Object.keys(error.response.data.errors)[0];
        const errorMessage = error.response.data.errors[firstErrorField][0];
        toast.error(errorMessage);
      } else {
        const message =
          error.response?.data?.message ||
          t("workspace.invite_modal.messages.error");
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="md">
      <div className="p-4 md:p-6 overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg w-fit shrink-0">
            <UserPlus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {t("workspace.invite_modal.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {t("workspace.invite_modal.subtitle", { name: workspace?.name })}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            id="email"
            label={t("workspace.invite_modal.email_label")}
            type="email"
            placeholder={t("workspace.invite_modal.email_placeholder")}
            register={register}
            error={errors.email?.message}
            icon={Mail}
            required
          />

          <div className="space-y-1 relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("workspace.invite_modal.role_label")}
            </label>
            <Select
              id="role_id"
              options={roleOptions}
              value={watch("role_id")}
              onChange={(val) =>
                setValue("role_id", Number(val), { shouldValidate: true })
              }
              placeholder={t("workspace.invite_modal.role_placeholder")}
            />
            {errors.role_id && (
              <p className="text-xs text-red-500 mt-1">
                {errors.role_id.message}
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="w-full md:w-auto order-2 md:order-1"
            >
              {t("workspace.invite_modal.cancel")}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              icon={UserPlus}
              className="w-full md:w-auto order-1 md:order-2"
            >
              {t("workspace.invite_modal.submit")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
