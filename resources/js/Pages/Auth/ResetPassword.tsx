import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import { z } from "zod";

import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";

import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail } from "lucide-react";
import { ChangeEvent, FormEventHandler } from "react";
import { useTranslation } from "react-i18next";

interface ResetPasswordProps {
  token: string;
  email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
  const { t } = useTranslation();

  const {
    data,
    setData,
    post,
    processing,
    errors,
    reset,
    setError,
    clearErrors,
  } = useForm({
    token: token,
    email: email,
    password: "",
    password_confirmation: "",
  });

  const schema = z
    .object({
      password: z.string().min(8, t("validation.min.string", { count: 8 })),
      password_confirmation: z.string().min(8),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("validation.passwords_do_not_match"),
      path: ["password_confirmation"],
    });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    clearErrors();

    const result = schema.safeParse(data);
    if (!result.success) {
      const formatted = result.error.format();
      Object.keys(formatted).forEach((key) => {
        if (key === "_errors") return;
        const msg = (formatted as any)[key]?._errors?.[0];
        if (msg) setError(key as any, msg);
      });
      return;
    }

    post(route("password.store"), {
      onFinish: () => reset("password", "password_confirmation"),
    });
  };

  return (
    <GuestLayout section="reset-password">
      <Head title="Reset Password" />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white ">
              {t("auth.reset-password.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("auth.reset-password.subtitle")}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {!errors.email && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("auth.reset-password.status.verified")}
                    </p>
                    <p className="text-xs mt-1">
                      {t("auth.reset-password.status.entering_for")} {email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Input
              id="email"
              type="email"
              label={t("auth.reset-password.inputs.email")}
              value={data.email}
              readOnly
              icon={Mail}
              error={errors.email}
            />

            <Input
              id="password"
              type="password"
              label={t("auth.reset-password.inputs.password")}
              value={data.password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setData("password", e.target.value)
              }
              placeholder={t("auth.reset-password.placeholders.password")}
              autoComplete="new-password"
              required
              autoFocus={!email}
              icon={Lock}
              showPasswordToggle
              error={errors.password}
            />

            <Input
              id="password_confirmation"
              type="password"
              label={t("auth.reset-password.inputs.confirm_password")}
              value={data.password_confirmation}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setData("password_confirmation", e.target.value)
              }
              placeholder={t(
                "auth.reset-password.placeholders.confirm_password",
              )}
              autoComplete="new-password"
              required
              icon={Lock}
              showPasswordToggle
              error={errors.password_confirmation}
            />

            <Button
              type="submit"
              loading={processing}
              loadingText={t("auth.reset-password.buttons.submitting")}
              fullWidth
              icon={KeyRound as any}
            >
              {t("auth.reset-password.buttons.submit")}
            </Button>

            {data.password && data.password_confirmation && (
              <div
                className={`p-3 rounded-lg ${
                  data.password === data.password_confirmation
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {data.password === data.password_confirmation ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {t("auth.reset-password.match.success")}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-sm text-primary-600 dark:text-primary-400">
                        {t("auth.reset-password.match.error")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </GuestLayout>
  );
}
