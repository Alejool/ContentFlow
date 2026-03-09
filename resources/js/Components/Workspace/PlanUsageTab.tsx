import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import Button from "@/Components/common/Modern/Button";
import { PlanUsageCards } from "@/Components/Subscription/PlanUsageCards";

interface PlanUsageTabProps {
  workspace: any;
}

export default function PlanUsageTab({ workspace }: PlanUsageTabProps) {
  const { t } = useTranslation();

  const planId =
    workspace.subscription?.plan?.toLowerCase() ||
    workspace.plan?.toLowerCase() ||
    "demo";

  return (
    <div className="space-y-6">
      {/* Usage Cards */}
      <PlanUsageCards showCarousel={true} showTitle={true} />
    </div>
  );
}
