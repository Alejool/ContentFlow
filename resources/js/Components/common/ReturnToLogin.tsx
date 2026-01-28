import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function ReturnToLogin() {
  const { t } = useTranslation();
  return (
    <div className="fixed top-6 left-6 z-50">
      <Link
        href={route("login")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80
                             backdrop-blur-sm border border-gray-200 dark:border-gray-700
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                             transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("auth.returnToLogin")}
      </Link>
    </div>
  );
}
