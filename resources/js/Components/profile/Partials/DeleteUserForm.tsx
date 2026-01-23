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

export default function DeleteUserForm({
  className = "",
}: DeleteUserFormProps) {
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
        Object.entries(error.response.data.errors).forEach(
          ([key, value]: [any, any]) => {
            setError(key as keyof DeleteUserFormData, { message: value[0] });
          },
        );
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
        <div className="p-5 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800/30 rounded-2xl flex gap-4 shadow-inner">
          <div className="flex-shrink-0 p-2 bg-primary-100 dark:bg-primary-800/40 rounded-lg h-fit">
            <AlertTriangle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wide">
              {t("profile.delete.warningTitle")}
            </h3>
            <p className="mt-1 text-sm text-primary-700 dark:text-primary-400 font-medium">
              {t("profile.delete.warningMessage")}
            </p>
          </div>
        </div>

        <ModernButton
          variant="danger"
          onClick={confirmUserDeletion}
          icon={Trash2 as any}
          className="font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary-500/20 active:scale-95 transition-transform"
        >
          {t("profile.delete.deleteButton")}
        </ModernButton>
      </div>

      <Modal show={confirmingUserDeletion} onClose={closeModal}>
        <form
          onSubmit={handleSubmit(deleteUser)}
          className="p-8 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {t("profile.delete.confirmTitle")}
            </h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium leading-relaxed">
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

          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <ModernButton
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="w-full sm:w-auto font-bold uppercase tracking-wider rounded-lg"
            >
              {t("profile.delete.cancel")}
            </ModernButton>

            <ModernButton
              variant="danger"
              disabled={isSubmitting}
              className={`w-full sm:w-auto font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary-500/20 ${
                isSubmitting
                  ? "opacity-50"
                  : "active:scale-95 transition-transform"
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
