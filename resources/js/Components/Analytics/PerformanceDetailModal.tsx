import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import { useTranslation } from "react-i18next";
import PerformanceTable, { CampaignStat } from "./PerformanceTable";

interface PerformanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: CampaignStat[];
}

export default function PerformanceDetailModal({
  isOpen,
  onClose,
  campaigns,
}: PerformanceDetailModalProps) {
  const { t } = useTranslation();

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("analytics.drilldown.title") || "Detalle de Rendimiento"}
      size="5xl"
    >
      <PerformanceTable campaigns={campaigns} />
    </DynamicModal>
  );
}
