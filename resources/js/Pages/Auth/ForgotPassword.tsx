import Logo from "@/../assets/logo.png";
import ThemeLanguageContainer from "@/Components/common/ThemeLanguageContainer";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Mail, Send, Shield } from "lucide-react";
import { FormEventHandler } from "react";

interface ForgotPasswordProps {
  status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route("password.email"));
  };

  return (
    <GuestLayout>
      <Head title="Forgot Password" />

      <ThemeLanguageContainer />

      <div className="fixed top-6 left-6 z-50">
        <Link
          href={route("login")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 
                             backdrop-blur-sm border border-gray-200 dark:border-gray-700 
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
                             transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
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
                  Password Recovery
                </h1>
                <p className="text-lg opacity-90 mb-8">
                  Don't worry, we'll help you get back into your account
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-semibold">Enter your email</p>
                    <p className="text-sm opacity-80">
                      We'll send you a secure reset link
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-semibold">Check your inbox</p>
                    <p className="text-sm opacity-80">
                      Look for our password reset email
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-semibold">Set new password</p>
                    <p className="text-sm opacity-80">
                      Create a strong new password
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4" />
                  <p className="text-sm font-medium">100% Secure Process</p>
                </div>
                <p className="text-xs opacity-80">
                  Your email is only used to send the reset link. We respect
                  your privacy.
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
                Enter your email to receive a reset link
              </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {status && (
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{status}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Forgot your password? No problem. Just enter your email
                  address below and we'll email you a password reset link that
                  will allow you to choose a new one.
                </p>
              </div>

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
                    onChange={(e) => setData("email", e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent
                                                 transition-all duration-200"
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

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
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Password Reset Link
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Didn't receive the email?
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-500 dark:text-gray-500">
                      • Check your spam folder
                    </p>
                    <p className="text-gray-500 dark:text-gray-500">
                      • Make sure you entered the correct email
                    </p>
                    <p className="text-gray-500 dark:text-gray-500">
                      • Wait a few minutes and try again
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href={route("login")}
                  className="inline-flex items-center gap-2 text-sm text-primary-600 
                                             hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300
                                             transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to login page
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </GuestLayout>
  );
}
