import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, router } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Key,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";

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
      .min(6, { message: t("twoFactor.errors.codeMustBe6Digits") })
      .max(6, { message: t("twoFactor.errors.codeMustBe6Digits") })
      .regex(/^\d+$/, { message: t("twoFactor.errors.codeOnlyNumbers") }),
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
      code: "",
    },
  });

  const onSubmit = async (data: SetupFormData) => {
    router.post(route("2fa.setup.store"), data, {
      onError: (errors) => {
        if (errors.code) {
          setError("code", {
            type: "server",
            message: errors.code as string,
          });
        }
      },
    });
  };

  const copyToClipboard = (text: string, type: "secret" | "backup", index?: number) => {
    navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else if (type === "backup" && index !== undefined) {
      setCopiedBackupCode(index);
      setTimeout(() => setCopiedBackupCode(null), 2000);
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={t("twoFactor.setup.title")} />
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
              <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("twoFactor.setup.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("twoFactor.setup.subtitle")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Security Warning */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {t("twoFactor.setup.securityWarning.title")}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    {t("twoFactor.setup.securityWarning.description")}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("twoFactor.setup.step1.title")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t("twoFactor.setup.step1.description")}
              </p>
              <div className="flex justify-center mb-4 p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={qrCodeUrl} 
                  size={192}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              {/* Manual Entry */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {t("twoFactor.setup.step1.manualEntry")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono">
                    {secret}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(secret, "secret")}
                    icon={copiedSecret ? CheckCircle2 : Copy}
                  >
                    {copiedSecret ? t("twoFactor.setup.copied") : t("twoFactor.setup.copy")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Backup Codes Section */}
            <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("twoFactor.setup.step2.title")}
              </h3>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      {t("twoFactor.setup.step2.warning.title")}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      {t("twoFactor.setup.step2.warning.description")}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono">
                      {code}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(code, "backup", index)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {copiedBackupCode === index ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("twoFactor.setup.step3.title")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t("twoFactor.setup.step3.description")}
              </p>
              
              <div className="mb-4">
                <Input
                  id="verification_code"
                  label={t("twoFactor.setup.step3.verificationCode")}
                  type="text"
                  sizeType="lg"
                  placeholder={t("twoFactor.setup.step3.placeholder")}
                  icon={Key}
                  maxLength={6}
                  error={errors.code?.message}
                  {...register("code")}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t("twoFactor.setup.step3.hint")}
                </p>
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                loadingText={t("twoFactor.setup.step3.verifying")}
                fullWidth
                icon={Shield}
              >
                {t("twoFactor.setup.step3.enableButton")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
