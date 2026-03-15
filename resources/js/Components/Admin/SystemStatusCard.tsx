import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SystemStatus {
  plans: Record<string, boolean>;
  addons: Record<string, boolean>;
  features: Record<string, boolean>;
  integrations: Record<string, boolean>;
  general: {
    maintenance_mode: boolean;
    new_registrations: boolean;
  };
}

interface Props {
  status: SystemStatus;
}

export default function SystemStatusCard({ status }: Props) {
  const { t } = useTranslation();

  const countEnabled = (items: Record<string, boolean>) => {
    return Object.values(items).filter(Boolean).length;
  };

  const countTotal = (items: Record<string, boolean>) => {
    return Object.keys(items).length;
  };

  const getStatusColor = (enabled: number, total: number) => {
    const percentage = (enabled / total) * 100;
    if (percentage === 100) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const StatusItem = ({
    label,
    enabled,
    total,
  }: {
    label: string;
    enabled: number;
    total: number;
  }) => {
    const Icon = enabled === total ? CheckCircle2 : enabled === 0 ? XCircle : AlertTriangle;
    const colorClass = getStatusColor(enabled, total);

    return (
      <div className="flex items-center justify-between border-b border-gray-200 py-2 last:border-b-0 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colorClass}`} />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
        </div>
        <Badge
          variant={enabled === total ? "default" : enabled === 0 ? "destructive" : "secondary"}
        >
          {enabled}/{total}
        </Badge>
      </div>
    );
  };

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">
          {t("admin.system_status.title")}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {t("admin.system_status.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.general.maintenance_mode && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                {t("admin.system_status.maintenance_mode.title")}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {t("admin.system_status.maintenance_mode.description")}
              </p>
            </div>
          </div>
        )}

        {!status.general.new_registrations && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                {t("admin.system_status.registrations_disabled.title")}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {t("admin.system_status.registrations_disabled.description")}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <StatusItem
            label={t("admin.system_status.categories.plans")}
            enabled={countEnabled(status.plans)}
            total={countTotal(status.plans)}
          />
          <StatusItem
            label={t("admin.system_status.categories.addons")}
            enabled={countEnabled(status.addons)}
            total={countTotal(status.addons)}
          />
          <StatusItem
            label={t("admin.system_status.categories.features")}
            enabled={countEnabled(status.features)}
            total={countTotal(status.features)}
          />
          <StatusItem
            label={t("admin.system_status.categories.integrations")}
            enabled={countEnabled(status.integrations)}
            total={countTotal(status.integrations)}
          />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {countEnabled(status.features)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t("admin.system_status.stats.active_features")}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {countEnabled(status.plans)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t("admin.system_status.stats.available_plans")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
