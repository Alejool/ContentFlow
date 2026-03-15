import ModernButton from "@/Components/common/Modern/Button";
import ModernCard from "@/Components/common/Modern/Card";
import ModernInput from "@/Components/common/Modern/Input";
import Modal from "@/Components/common/ui/Modal";
import { DeleteUserFormData, deleteUserSchema } from "@/schemas/user";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm as useHookForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface DeleteUserFormProps {
  className?: string;
}

export default function DeleteUserForm({ className = "" }: DeleteUserFormProps) {
  const { t } = useTranslation();
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useHookForm<DeleteUserFormData>({
    resolver: zodResolver(deleteUserSchema(t)),
  });

  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true);
  };

  const deleteUser = async (data: DeleteUserFormData) => {
    try {
      await axios.delete(route("profile.destroy"), {
        data,
      });
      window.location.href = "/";
    } catch (error: any) {
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]: [any, any]) => {
          setError(key as keyof DeleteUserFormData, { message: value[0] });
        });
      }
    }
  };

  const closeModal = () => {
    setConfirmingUserDeletion(false);
    reset();
  };

  return (
    <ModernCard
      title={t("profile.delete.title")}
      description={t("profile.delete.description")}
      icon={Trash2}
      headerColor="red"
      className={className}
    >
      <div className="space-y-6">
        <div className="flex gap-4 rounded-lg border border-primary-200 bg-primary-50 p-5 shadow-inner dark:border-primary-800/30 dark:bg-primary-900/10">
          <div className="h-fit flex-shrink-0 rounded-lg bg-primary-100 p-2 dark:bg-primary-800/40">
            <AlertTriangle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary-800 dark:text-primary-300">
              {t("profile.delete.warningTitle")}
            </h3>
            <p className="mt-1 text-sm font-medium text-primary-700 dark:text-primary-400">
              {t("profile.delete.warningMessage")}
            </p>
          </div>
        </div>

        <ModernButton
          variant="danger"
          onClick={confirmUserDeletion}
          icon={Trash2 as any}
          className="rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-primary-500/20 transition-transform active:scale-95"
        >
          {t("profile.delete.deleteButton")}
        </ModernButton>
      </div>

      <Modal show={confirmingUserDeletion} onClose={closeModal}>
        <form onSubmit={handleSubmit(deleteUser)} className="p-8 dark:bg-neutral-900">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
              <AlertTriangle className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {t("profile.delete.confirmTitle")}
            </h2>
          </div>

          <p className="mb-8 font-medium leading-relaxed text-gray-600 dark:text-gray-400">
            {t("profile.delete.confirmMessage")}
          </p>

          <div className="mb-8">
            <ModernInput
              id="password"
              type="password"
              label={t("profile.delete.passwordLabel")}
              register={register}
              error={errors.password?.message}
              placeholder={t("profile.delete.passwordPlaceholder")}
              showPasswordToggle
              autoFocus
              variant="filled"
            />
          </div>

          <div className="flex flex-col justify-end gap-4 sm:flex-row">
            <ModernButton
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="w-full rounded-lg font-bold uppercase tracking-wider sm:w-auto"
            >
              {t("profile.delete.cancel")}
            </ModernButton>

            <ModernButton
              variant="danger"
              disabled={isSubmitting}
              className={`w-full rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-primary-500/20 sm:w-auto ${
                isSubmitting ? "opacity-50" : "transition-transform active:scale-95"
              }`}
              type="submit"
              loading={isSubmitting}
            >
              {t("profile.delete.deleteButton")}
            </ModernButton>
          </div>
        </form>
      </Modal>
    </ModernCard>
  );
}
