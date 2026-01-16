import PerformanceTable, {
  CampaignStat,
} from "@/Components/Analytics/PerformanceTable";
import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useTranslation } from "react-i18next";

interface Props {
  auth: any;
  campaigns: {
    data: any[];
    links: any[];
    meta: any;
  };
  performanceData: CampaignStat[];
}

export default function Index({ auth, campaigns, performanceData }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <AuthenticatedLayout>
      <Head title={t("campaigns.title", "Campaigns")} />

      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t("campaigns.title", "Resumen de Rendimiento")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t(
                "campaigns.subtitle",
                "Analiza el impacto y rendimiento de tus campañas y publicaciones."
              )}
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl shadow-sm border ${
            theme === "dark"
              ? "bg-neutral-800 border-neutral-700"
              : "bg-white border-gray-200"
          } overflow-hidden`}
        >
          <PerformanceTable campaigns={performanceData} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
