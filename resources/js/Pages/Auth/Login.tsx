import { useAuth } from "@/Hooks/useAuth";
import GuestLayout from "@/Layouts/GuestLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Head, Link } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/Components/common/Modern/Button";
import Input from "@/Components/common/Modern/Input";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  UserPlus,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const {
    error: authError,
    successMessage,
    submitLogin,
    handleGoogleLogin,
  } = useAuth();

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, { message: t("validation.required") })
      .email({ message: t("validation.email") }),
    password: z.string().min(1, { message: t("validation.required") }),
    remember: z.boolean().default(false),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await submitLogin(data);
    } catch (errorData: any) {
      if (typeof errorData === "object") {
        Object.keys(errorData).forEach((key) => {
          setError(key as any, {
            type: "server",
            message: errorData[key][0],
          });
        });
      }
    }
  };

  useEffect(() => {}, []);

  return (
    <GuestLayout section="login">
      <Head title={t("auth.login.title")} />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white ">
              {t("auth.login.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("auth.login.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {authError && (
              <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4">
                <div className="flex items-center gap-3 text-primary-700 dark:text-primary-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{authError}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              </div>
            )}

            <div>
              <Input
                id="login_email"
                label={t("auth.login.inputs.email")}
                type="email"
                sizeType="lg"
                placeholder={t("auth.login.placeholders.email")}
                icon={Mail}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  id="login_password"
                  label={t("auth.login.inputs.password")}
                  type="password"
                  sizeType="lg"
                  placeholder={t("auth.login.placeholders.password")}
                  icon={Lock}
                  showPasswordToggle
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600
                             focus:ring-primary-500 focus:ring-offset-0"
                  {...register("remember")}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t("auth.login.buttons.rememberMe")}
                </span>
              </label>

              <Link
                href={route("password.request")}
                className="text-sm font-medium text-primary-600 hover:text-primary-500
                           dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                {t("auth.login.buttons.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              loadingText={t("auth.login.buttons.loggingIn")}
              fullWidth
              icon={LogIn as any}
            >
              {t("auth.login.buttons.login")}
            </Button>

            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {t("auth.login.orContinueWith")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-3
                           rounded-lg border border-gray-300 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">
                  {t("auth.login.buttons.google")}
                </span>
              </button>
            </div>

            <div className="text-center ">
              <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-center gap-2">
                {t("auth.login.noAccount")}{" "}
                <Link
                  href={route("register")}
                  className="inline-flex items-center gap-1 font-semibold text-primary-600
                             hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300
                             transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  {t("auth.login.buttons.registerLink")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </GuestLayout>
  );
}
