import { Sparkles, HardDrive, FileText, Users, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ActiveAddon } from "@/Hooks/useActiveAddons";

interface AddonCardProps {
  addon: ActiveAddon;
}

export function AddonCard({ addon }: AddonCardProps) {
  const { t } = useTranslation();

  const getIcon = (type: ActiveAddon["type"]) => {
    switch (type) {
      case "ai_credits":
        return Sparkles;
      case "storage":
        return HardDrive;
      case "publications":
        return FileText;
      case "team_members":
        return Users;
      default:
        return Package;
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 75) return "bg-orange-500";
    if (percentage > 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadge = (addon: ActiveAddon) => {
    if (addon.status === "expired") {
      return (
        <span className="absolute -top-5 -right-5 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded-full font-semibold">
          {t("subscription.addons.expired", "Expirado")}
        </span>
      );
    }
    if (addon.status === "depleted") {
      return (
        <span className="absolute -top-5 -right-5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full font-semibold">
          {t("subscription.addons.depleted", "Agotado")}
        </span>
      );
    }
    if (addon.percentage > 90) {
      return (
        <span className="absolute -top-5 -right-5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full font-semibold">
          {t("subscription.addons.lowBalance", "Bajo")}
        </span>
      );
    }
    return (
      <span className="absolute -top-5 -right-5 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full font-semibold">
        {t("subscription.addons.active", "Activo")}
      </span>
    );
  };

  const Icon = getIcon(addon.type);
  const isLow = addon.percentage > 75;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-2 transition-all shadow-sm hover:shadow-md ${
        isLow
          ? "border-orange-300 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-800/50">
            <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {t(`subscription.addons.packages.${addon.sku}.name`, addon.name)}
          </span>
        </div>
        {getStatusBadge(addon)}
      </div>

      {/* Uso actual - Más prominente */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {t("subscription.addons.currentUsage", "Uso Actual")}
          </span>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              addon.percentage > 90
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                : addon.percentage > 75
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
            }`}
          >
            {addon.percentage.toFixed(0)}%
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {addon.type === "storage"
              ? `${addon.used.toFixed(1)} GB`
              : addon.used.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            /{" "}
            {addon.type === "storage"
              ? `${addon.amount} GB`
              : addon.amount.toLocaleString()}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressBarColor(addon.percentage)}`}
            style={{ width: `${Math.min(addon.percentage, 100)}%` }}
          />
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">
            {t("subscription.addons.remaining", "Restante")}:{" "}
          </span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {addon.type === "storage"
              ? `${addon.remaining.toFixed(1)} GB`
              : addon.remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Información de compra */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {addon.purchase_count && addon.purchase_count > 1 ? (
            <>
              {t("subscription.addons.multiplePurchases", "{{count}} compras", {
                count: addon.purchase_count,
              })}
              {" • "}
              <span className="font-semibold">
                ${addon.total_price?.toFixed(2)}
              </span>
            </>
          ) : (
            <>
              {t("subscription.addons.purchasedOn", "Comprado el")}:{" "}
              {addon.first_purchased_at
                ? new Date(addon.first_purchased_at).toLocaleDateString()
                : "N/A"}
              {" • "}
              <span className="font-semibold">
                ${addon.price?.toFixed(2) || addon.total_price?.toFixed(2)}
              </span>
            </>
          )}
        </div>
        {addon.expires_at && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("subscription.addons.expiresOn", "Expira el")}:{" "}
            {new Date(addon.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
