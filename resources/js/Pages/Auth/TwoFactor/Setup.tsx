import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import { AlertCircle, CheckCircle2, Copy, Key, Shield } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

interface SetupProps {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

export default function Setup({ qrCodeUrl, secret, backupCodes }: SetupProps) {
  const { t } = useTranslation();
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCode, setCopiedBackupCode] = useState<number | null>(null);

  const setupSchema = z.object({
    code: z
      .string()
      .min(6, { message: t('twoFactor.errors.codeMustBe6Digits') })
      .max(6, { message: t('twoFactor.errors.codeMustBe6Digits') })
      .regex(/^\d+$/, { message: t('twoFactor.errors.codeOnlyNumbers') }),
  });

  type SetupFormData = z.infer<typeof setupSchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: SetupFormData) => {
    router.post(route('2fa.setup.store'), data, {
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

  const copyToClipboard = (text: string, type: 'secret' | 'backup', index?: number) => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else if (type === 'backup' && index !== undefined) {
      setCopiedBackupCode(index);
      setTimeout(() => setCopiedBackupCode(null), 2000);
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('twoFactor.setup.title')} />
      <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-neutral-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('twoFactor.setup.title')}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('twoFactor.setup.subtitle')}</p>
          </div>

          <div className="space-y-6">
            {/* Security Warning */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {t('twoFactor.setup.securityWarning.title')}
                  </p>
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                    {t('twoFactor.setup.securityWarning.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t('twoFactor.setup.step1.title')}
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('twoFactor.setup.step1.description')}
              </p>
              <div className="mb-4 flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG value={qrCodeUrl} size={192} level="H" includeMargin={true} />
              </div>

              {/* Manual Entry */}
              <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                  {t('twoFactor.setup.step1.manualEntry')}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded border border-gray-200 bg-white px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800">
                    {secret}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(secret, 'secret')}
                    icon={copiedSecret ? CheckCircle2 : Copy}
                  >
                    {copiedSecret ? t('twoFactor.setup.copied') : t('twoFactor.setup.copy')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Backup Codes Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t('twoFactor.setup.step2.title')}
              </h3>
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-700 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      {t('twoFactor.setup.step2.warning.title')}
                    </p>
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500">
                      {t('twoFactor.setup.step2.warning.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <code className="flex-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900/50">
                      {code}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(code, 'backup', index)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {copiedBackupCode === index ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {t('twoFactor.setup.step3.title')}
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {t('twoFactor.setup.step3.description')}
              </p>

              <div className="mb-4">
                <Input
                  id="verification_code"
                  label={t('twoFactor.setup.step3.verificationCode')}
                  type="text"
                  sizeType="lg"
                  placeholder={t('twoFactor.setup.step3.placeholder')}
                  icon={Key}
                  maxLength={6}
                  error={errors.code?.message}
                  {...register('code')}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {t('twoFactor.setup.step3.hint')}
                </p>
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                loadingText={t('twoFactor.setup.step3.verifying')}
                fullWidth
                icon={Shield}
              >
                {t('twoFactor.setup.step3.enableButton')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
