import Logo from "@/../assets/logo.png";
import ThemeSwitcher from "@/Components/ThemeSwitcher";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { FormEventHandler, useState } from "react";

interface ResetPasswordProps {
  token: string;
  email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token: token,
    email: email,
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route("password.store"), {
      onFinish: () => reset("password", "password_confirmation"),
    });
  };

  return (
    <GuestLayout>
      <Head title="Reset Password" />

      <div className="fixed top-6 right-6 z-50">
        <ThemeSwitcher />
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
                  Set New Password
                </h1>
                <p className="text-lg opacity-90 mb-8">
                  Create a strong and secure new password
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Strong & Secure</p>
                    <p className="text-sm opacity-80">
                      Minimum 8 characters with mix
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Easy to Remember</p>
                    <p className="text-sm opacity-80">But hard to guess</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Unique Password</p>
                    <p className="text-sm opacity-80">
                      Different from other accounts
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <p className="text-sm font-medium">Your Security Matters</p>
                </div>
                <p className="text-xs opacity-80">
                  We never store passwords in plain text. All passwords are
                  encrypted.
                </p>
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
                Reset Password
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {!errors.email && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Reset link verified</p>
                      <p className="text-xs mt-1">
                        Entering password for: {email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    readOnly
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                                                 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white
                                                 cursor-not-allowed"
                  />
                </div>
                {errors.email && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent
                                                 transition-all duration-200"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                                                 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="password_confirmation"
                    name="password_confirmation"
                    value={data.password_confirmation}
                    onChange={(e) =>
                      setData("password_confirmation", e.target.value)
                    }
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent
                                                 transition-all duration-200"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                                                 dark:hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password_confirmation}
                  </div>
                )}
              </div>

              {data.password && (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password Strength
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        data.password.length >= 8
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          : data.password.length >= 4
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {data.password.length >= 8
                        ? "Strong"
                        : data.password.length >= 4
                        ? "Medium"
                        : "Weak"}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        data.password.length >= 8
                          ? "bg-green-500 w-full"
                          : data.password.length >= 4
                          ? "bg-yellow-500 w-1/2"
                          : "bg-red-500 w-1/4"
                      }`}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      {data.password.length >= 8 ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-gray-400" />
                      )}
                      <span
                        className={
                          data.password.length >= 8
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/[A-Z]/.test(data.password) &&
                      /[a-z]/.test(data.password) ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-gray-400" />
                      )}
                      <span
                        className={
                          /[A-Z]/.test(data.password) &&
                          /[a-z]/.test(data.password)
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        Mix of uppercase & lowercase
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/\d/.test(data.password) ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-gray-400" />
                      )}
                      <span
                        className={
                          /\d/.test(data.password)
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        Include numbers
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-primary text-white py-3 px-4 rounded-xl font-semibold
                                         hover:opacity-90 active:scale-[0.98] transition-all duration-200
                                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>

              {data.password && data.password_confirmation && (
                <div
                  className={`p-3 rounded-lg ${
                    data.password === data.password_confirmation
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {data.password === data.password_confirmation ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          Passwords don't match
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </GuestLayout>
  );
}
