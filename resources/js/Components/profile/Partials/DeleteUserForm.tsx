import Button from '@/Components/common/Modern/Button';
import ModernCard from '@/Components/common/Modern/Card';
import Input from '@/Components/common/Modern/Input';
import Modal from '@/Components/common/ui/Modal';
import type { DeleteUserFormData } from '@/schemas/Auth/user';
import { deleteUserSchema } from '@/schemas/Auth/user';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface DeleteUserFormProps {
  className?: string;
}

export default function DeleteUserForm({ className = '' }: DeleteUserFormProps) {
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
      await axios.delete(route('profile.destroy'), {
        data,
      });
      window.location.assign('/');
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
      title={t('profile.delete.title')}
      description={t('profile.delete.description')}
      icon={Trash2}
      headerColor="red"
      className={className}
    >
      <div className="space-y-6">
        <div className="border-primary-200 bg-primary-50 dark:border-primary-800/30 dark:bg-primary-900/10 flex gap-4 rounded-lg border p-5 shadow-inner">
          <div className="bg-primary-100 dark:bg-primary-800/40 h-fit shrink-0 rounded-lg p-2">
            <AlertTriangle className="text-primary-600 dark:text-primary-400 h-6 w-6" />
          </div>
          <div>
            <h3 className="text-primary-800 dark:text-primary-300 text-sm font-bold tracking-wide uppercase">
              {t('profile.delete.warningTitle')}
            </h3>
            <p className="text-primary-700 dark:text-primary-400 mt-1 text-sm font-medium">
              {t('profile.delete.warningMessage')}
            </p>
          </div>
        </div>

        <Button
          variant="danger"
          onClick={confirmUserDeletion}
          icon={Trash2 as any}
          className="shadow-primary-500/20 rounded-lg font-bold tracking-wider uppercase shadow-lg transition-transform active:scale-95"
        >
          {t('profile.delete.deleteButton')}
        </Button>
      </div>

      <Modal show={confirmingUserDeletion} onClose={closeModal}>
        <form onSubmit={handleSubmit(deleteUser)} className="p-8 dark:bg-neutral-900">
          <div className="mb-6 flex items-center gap-4">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
              <AlertTriangle className="text-primary-600 dark:text-primary-400 h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {t('profile.delete.confirmTitle')}
            </h2>
          </div>

          <p className="mb-8 leading-relaxed font-medium text-gray-600 dark:text-gray-400">
            {t('profile.delete.confirmMessage')}
          </p>

          <div className="mb-8">
            <Input
              id="password"
              type="password"
              label={t('profile.delete.passwordLabel')}
              register={register}
              error={errors.password?.message}
              placeholder={t('profile.delete.passwordPlaceholder')}
              showPasswordToggle
              variant="filled"
            />
          </div>

          <div className="flex flex-col justify-end gap-4 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="w-full rounded-lg font-bold tracking-wider uppercase sm:w-auto"
            >
              {t('profile.delete.cancel')}
            </Button>

            <Button
              variant="danger"
              disabled={isSubmitting}
              className={`shadow-primary-500/20 w-full rounded-lg font-bold tracking-wider uppercase shadow-lg sm:w-auto ${
                isSubmitting ? 'opacity-50' : 'transition-transform active:scale-95'
              }`}
              type="submit"
              loading={isSubmitting}
            >
              {t('profile.delete.deleteButton')}
            </Button>
          </div>
        </form>
      </Modal>
    </ModernCard>
  );
}
