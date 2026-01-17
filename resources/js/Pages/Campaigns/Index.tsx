import CampaignPerformance from "@/Components/Analytics/CampaignPerformance";
import { CampaignStat } from "@/Components/Analytics/PerformanceTable";
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
        <CampaignPerformance
          campaigns={performanceData}
          theme={theme as any}
          title={t("campaigns.title", "Resumen de Rendimiento")}
          subtitle={t(
            "campaigns.subtitle",
            "Analiza el impacto y rendimiento de tus campañas y publicaciones."
          )}
        />
      </div>
    </AuthenticatedLayout>
  );
}
