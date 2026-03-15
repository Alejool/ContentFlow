import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function ReturnToLogin() {
  const { t } = useTranslation();
  return (
    <div className="fixed left-6 top-6 z-50">
      <Link
        href={route("login")}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white/80 px-4 py-2 text-gray-700 backdrop-blur-sm transition-all duration-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("auth.returnToLogin")}
      </Link>
    </div>
  );
}
