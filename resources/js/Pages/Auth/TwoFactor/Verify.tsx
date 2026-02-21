import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, router } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import {
  AlertCircle,
  Key,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Verify() {
  const { t } = useTranslation();

  const verifySchema = z.object({
    code: z
      .string()
      .min(1, { message: "Verification code is required" }),
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
      code: "",
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    router.post(route("2fa.verify.store"), data, {
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

  return (
    <AuthenticatedLayout>
      <Head title="Two-Factor Authentication" />
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
              <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Enter your authentication code to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary-700 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
                    Security Check Required
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-500 mt-1">
                    Open your authenticator app and enter the 6-digit code. You can also use a backup code if you don't have access to your device.
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
                {...register("code")}
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
                Lost your device?{" "}
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
