import { Publication } from "@/types/Publication";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ApprovalLevelCard from "./ApprovalLevelCard";

interface ApprovalLevel {
  level_number: number;
  level_name: string;
  role: {
    id: number;
    name: string;
    display_name: string;
    slug: string;
  };
  is_current_level: boolean;
  is_past_level: boolean;
  is_future_level: boolean;
  approved_action?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
      photo_url?: string;
    };
    comment?: string;
    created_at: string;
  };
  rejected_action?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
      photo_url?: string;
    };
    comment?: string;
    created_at: string;
  };
  can_user_approve: boolean;
  status: "approved" | "rejected" | "in_review" | "pending" | "skipped";
}

interface ApprovalFlowData {
  workflow: {
    id: number;
    is_multi_level: boolean;
    total_levels: number;
  };
  flow: ApprovalLevel[];
  publication_status: string;
  current_level: number;
  user_role?: {
    id: number;
    name: string;
    display_name: string;
    slug: string;
  };
}

interface ApprovalFlowVisualizationProps {
  publication: Publication;
  onRefresh?: () => void;
}

export default function ApprovalFlowVisualization({
  publication,
  onRefresh,
}: ApprovalFlowVisualizationProps) {
  const { t } = useTranslation();
  const [flowData, setFlowData] = useState<ApprovalFlowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovalFlow();
  }, [publication.id]);

  const fetchApprovalFlow = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(
        route("api.v1.publications.approval-flow", publication.id)
      );

      if (response.data.success) {
        setFlowData(response.data);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Error al cargar el flujo de aprobación";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (comment?: string) => {
    try {
      const response = await axios.post(
        route("api.v1.publications.approve", publication.id),
        { comment }
      );

      if (response.data.success) {
        const updatedPublication = response.data.content;

        if (updatedPublication.status === "approved") {
          toast.success(
            t("approvals.messages.finalApproval") ||
              "Aprobación final completada. El contenido está listo para publicar."
          );
        } else {
          const currentLevel = updatedPublication.current_approval_level;
          toast.success(
            t("approvals.messages.levelApproved", { level: currentLevel - 1 }) ||
              `Nivel ${currentLevel - 1} aprobado. Avanzando al siguiente nivel.`
          );
        }

        // Refresh flow data
        await fetchApprovalFlow();
        
        // Notify parent to refresh
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al aprobar el contenido";
      toast.error(errorMessage);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      const response = await axios.post(
        route("api.v1.publications.reject", publication.id),
        { rejection_reason: reason }
      );

      if (response.data.success) {
        const currentLevel = flowData?.current_level || 0;
        toast.success(
          t("approvals.messages.rejectedAtLevel", { level: currentLevel }) ||
            `Contenido rechazado en el nivel ${currentLevel}.`
        );

        // Refresh flow data
        await fetchApprovalFlow();
        
        // Notify parent to refresh
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Error al rechazar el contenido";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          {t("common.loading")}...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!flowData) {
    return null;
  }

  const completedLevels = flowData.flow.filter(
    (level) => level.status === "approved"
  ).length;
  const totalLevels = flowData.workflow.total_levels;
  const progressPercentage = (completedLevels / totalLevels) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("approvals.flowVisualization.title") || "Flujo de Aprobación"}
        </h3>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>
              {t("approvals.flowVisualization.completedLevels") ||
                "Niveles Completados"}
              : {completedLevels} / {totalLevels}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Estado actual:
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              publication.status === "approved"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : publication.status === "rejected"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}
          >
            {t(`manageContent.status.${publication.status}`) ||
              publication.status}
          </span>
        </div>
      </div>

      {/* Approval Levels */}
      <div className="space-y-4">
        {flowData.flow.map((level) => (
          <ApprovalLevelCard
            key={level.level_number}
            level={level}
            publication={publication}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}
