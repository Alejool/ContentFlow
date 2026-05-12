import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import { AlertCircle, Key, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Verify() {
  const { t } = useTranslation();

  const verifySchema = z.object({
    code: z.string().min(1, { message: 'Verification code is required' }),
  });

  type VerifyFormData = z.infer<typeof verifySchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    router.post(route('2fa.verify.store'), data, {
      onError: (errors) => {
        if (errors.code) {
          setError('code', {
            type: 'server',
            message: errors.code as string,
          });
        }
      },
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Two-Factor Authentication" />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 lg:px-8 dark:bg-neutral-900">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="bg-primary-100 dark:bg-primary-900/30 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
              <Shield className="text-primary-600 dark:text-primary-400 h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter your authentication code to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-primary-700 dark:text-primary-400 mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-primary-700 dark:text-primary-400 text-sm font-medium">
                    Security Check Required
                  </p>
                  <p className="text-primary-600 dark:text-primary-500 mt-1 text-xs">
                    Open your authenticator app and enter the 6-digit code. You can also use a
                    backup code if you don't have access to your device.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Input
                id="verification_code"
                label="Verification Code"
                type="text"
                sizeType="lg"
                placeholder="Enter 6-digit code or backup code"
                icon={Key}
                error={errors.code?.message}
                autoFocus
                {...register('code')}
              />
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Verifying..."
              fullWidth
              icon={Shield}
            >
              Verify
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lost your device?{' '}
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  Use a backup code
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
