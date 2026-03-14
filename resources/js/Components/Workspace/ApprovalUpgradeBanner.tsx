import Button from "@/Components/common/Modern/Button";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ApprovalUpgradeBannerProps {
  currentPlan?: string;
  className?: string;
}

/**
 * Banner reutilizable para mostrar mensaje de upgrade de aprobaciones básicas a avanzadas.
 * Se muestra cuando el plan actual es 'basic' (Professional) y el usuario intenta acceder
 * a características de multinivel que solo están disponibles en Enterprise.
 */
export default function ApprovalUpgradeBanner({
  currentPlan = "professional",
  className = "",
}: ApprovalUpgradeBannerProps) {
  const { t } = useTranslation();

  // @ts-ignore
  const route = window.route;

  return (
    <div
      className={`bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-full shrink-0">
          <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-primary-900 dark:text-primary-300">
            {t("common.approvals.basic_enabled.title")}
          </p>
          <p className="text-xs text-primary-700 dark:text-primary-400 mt-1 leading-relaxed max-w-xl">
            {t("common.approvals.basic_enabled.description")}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="primary"
        buttonStyle="solid"
        onClick={() => (window.location.href = route("pricing"))}
        className="shrink-0 whitespace-nowrap shadow-md shadow-primary-500/20"
      >
        {t("common.upgrade_plan") || "Upgrade Plan"}
      </Button>
    </div>
  );
}
