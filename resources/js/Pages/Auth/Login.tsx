import Logo from "@/../assets/logo.png";
import LanguageSwitcher from "@/Components/LanguageSwitcher";
import ThemeSwitcher from "@/Components/ThemeSwitcher";
import { useAuth } from "@/Hooks/useAuth";
import GuestLayout from "@/Layouts/GuestLayout";
import { auth, getAuthResult } from "@/firebase";
import { Head, Link, usePage } from "@inertiajs/react";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Lock,
  LogIn,
  Mail,
  Shield,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { ChangeEvent, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const { errors } = usePage().props;
  const {
    data,
    setData,
    error,
    loading,
    successMessage,
    processing,
    handleEmailLogin,
    handleGoogleLogin,
    handleFacebookLogin,
    handleAnonymousLogin,
  } = useAuth();

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getAuthResult();
        if (result?.user) {
          window.location.href = route("dashboard");
        }
      } catch (err) {
        console.error("Error processing redirection:", err);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, () => {});
    checkRedirectResult();
    return () => unsubscribe();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setData(name, type === "checkbox" ? checked : value);
  };

  return (
    <GuestLayout>
      <Head title={t("auth.login.title")} />

      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full lg:w-1/2 bg-gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative h-full flex flex-col items-center justify-center p-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-xl"
            >
              <div className="mb-8">
                <img src={Logo} alt="logo" className="w-36 h-36 mx-auto" />
                <h1 className="text-4xl font-bold font-poppins mb-4">
                  {t("auth.login.welcome")}
                </h1>
                <p className="text-lg opacity-90 mb-8">
                  {t("auth.login.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Secure Access</p>
                    <p className="text-sm opacity-80">End-to-end encryption</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Global Platform</p>
                    <p className="text-sm opacity-80">Access anywhere</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Mobile Friendly</p>
                    <p className="text-sm opacity-80">Responsive design</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Verified</p>
                    <p className="text-sm opacity-80">Trusted by thousands</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
                {t("auth.login.title")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-6">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{successMessage}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("auth.login.email")}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent
                             transition-all duration-200"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("auth.login.password")}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={data.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent
                             transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={data.remember}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 
                             focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </span>
                </label>

                <Link
                  href={route("password.request")}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 
                           dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={processing || loading}
                className="w-full bg-gradient-primary text-white py-3 px-4 rounded-xl font-semibold
                         hover:opacity-90 active:scale-[0.98] transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("auth.login.loggingIn")}
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {t("auth.login.loginButton")}
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
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
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 
                           rounded-xl border border-gray-300 dark:border-gray-700 
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
                  <span className="font-medium">{t("auth.login.google")}</span>
                </button>
              </div>

              <div className="text-center pt-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t("auth.login.noAccount")}{" "}
                  <Link
                    href={route("register")}
                    className="inline-flex items-center gap-1 font-semibold text-primary-600 
                             hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300
                             transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t("auth.login.registerLink")}
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </GuestLayout>
  );
}
