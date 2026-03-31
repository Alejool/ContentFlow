import ModernButton from '@/Components/common/Modern/Button';
import ModernInput from '@/Components/common/Modern/Input';
import { useUpdatePassword } from '@/Hooks/profile/useUpdatePassword';
import { Transition } from '@headlessui/react';
import { AlertTriangle, Check, Key, Lock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UpdatePasswordFormProps {
  className?: string;
}

interface IconProps {
  className?: string;
}

const LockIcon = ({ className }: IconProps) => <Lock className={className} />;

const CheckIcon = ({ className = 'w-5 h-5' }: IconProps) => <Check className={className} />;

interface SuccessAlertProps {
  show: boolean;
  t: (key: string) => string;
}

const SuccessAlert = ({ show, t }: SuccessAlertProps) => (
  <Transition
    show={show}
    enter="transform transition duration-300 ease-out"
    enterFrom="translate-y-2 opacity-0"
    enterTo="translate-y-0 opacity-100"
    leave="transform transition duration-200 ease-in"
    leaveFrom="translate-y-0 opacity-100"
    leaveTo="translate-y-2 opacity-0"
  >
    <div className="mb-8 flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-5 shadow-sm dark:border-green-800/50 dark:bg-green-900/20">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-800/40">
        <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-green-800 dark:text-green-300">
          {t('profile.password.successTitle')}
        </p>
        <p className="text-sm font-medium text-green-600 dark:text-green-400/80">
          {t('profile.password.successMessage')}
        </p>
      </div>
    </div>
  </Transition>
);

const UpdatePasswordForm = ({ className = '' }: UpdatePasswordFormProps) => {
  const { t } = useTranslation();

  const { register, handleSubmit, errors, isSubmitting, isSuccess } = useUpdatePassword();

  return (
    <div className={className}>
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-red-600 dark:text-red-400">
            <LockIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {t('profile.password.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {t('profile.password.description')}
            </p>
          </div>
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {errors && Object.keys(errors).length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 mb-8 rounded-lg border border-primary-100 bg-primary-50 p-5 shadow-sm duration-300 dark:border-primary-800/30 dark:bg-primary-900/20">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-800/40">
                <AlertTriangle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-primary-800 dark:text-primary-300">
                {t('profile.password.errorTitle')}
              </h3>
            </div>
            <ul className="ml-11 list-disc space-y-1.5 text-sm font-medium leading-relaxed text-primary-700 dark:text-primary-400">
              {Object.entries(errors).map(([field, error]: [string, any]) => (
                <li key={field}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        <SuccessAlert show={isSuccess} t={t} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <ModernInput
            id="current_password"
            label={t('profile.password.currentPassword')}
            type="password"
            placeholder={t('profile.password.placeholders.current')}
            register={register}
            error={errors.current_password?.message}
            showPasswordToggle
            icon={Key}
          />

          <ModernInput
            id="password"
            label={t('profile.password.newPassword')}
            type="password"
            placeholder={t('profile.password.placeholders.new')}
            register={register}
            error={errors.password?.message}
            showPasswordToggle
            icon={Lock}
          />

          <ModernInput
            id="password_confirmation"
            label={t('profile.password.confirmPassword')}
            type="password"
            placeholder={t('profile.password.placeholders.confirm')}
            register={register}
            error={errors.password_confirmation?.message}
            showPasswordToggle
            icon={Lock}
          />

          <div className="pt-6">
            <ModernButton
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              icon={Key}
              loading={isSubmitting}
              className="w-full min-w-[200px] rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-primary-500/20 transition-transform active:scale-95 sm:w-auto"
            >
              {isSubmitting ? t('common.updating') : t('profile.password.updateButton')}
            </ModernButton>

            {isSubmitting && (
              <div className="mt-4 flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                {t('common.processing')}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordForm;
