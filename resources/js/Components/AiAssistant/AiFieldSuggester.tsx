import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";

interface AiFieldSuggesterProps {
  fields: Record<string, any>;
  type: "publication" | "campaign";
  onSuggest: (data: any) => void;
  disabled?: boolean;
  className?: string;
}

const AiFieldSuggester: React.FC<AiFieldSuggesterProps> = ({
  fields,
  type,
  onSuggest,
  disabled = false,
  className = "",
}) => {
  const { t } = useTranslation();
  const { auth, ai_enabled } = usePage<any>().props;
  const [loading, setLoading] = useState(false);

  const isAiConfigured = useMemo(() => {
    // Must be enabled globally AND user must have at least one provider configured
    if (!ai_enabled) return false;

    const settings = auth.user?.ai_settings || {};
    return Object.values(settings).some((s: any) => s.enabled && s.api_key);
  }, [auth.user, ai_enabled]);

  const handleSuggest = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      // Define field limits based on type
      const fieldLimits = type === "publication" 
        ? {
            title: { min: 1, max: 70 },
            description: { min: 10, max: 700 },
            goal: { min: 5, max: 200 },
            hashtags: { min: 1, max: 10 }
          }
        : {
            name: { min: 1, max: 100 },
            description: { min: 1, max: 500 },
            goal: { min: 1, max: 200 }
          };

      const response = await axios.post(route("api.v1.ai.suggest-fields"), {
        fields,
        type,
        language: auth.user?.locale || "es",
        field_limits: fieldLimits,
      });

      if (response.data.success && response.data.data) {
        onSuggest(response.data.data);
        toast.success(
          t("common.ai.suggestions_generated") ||
            "Sugerencias generadas con éxito",
          { id: "ai-suggestions" }
        );
      } else {
        toast.error(
          response.data.message ||
            t("common.ai.suggestion_failed") ||
            "No se pudieron generar sugerencias",
        );
      }
    } catch (error: any) {
      console.error("AI Suggestion Error:", error);
      toast.error(
        error.response?.data?.message ||
          t("common.error") ||
          "Error al procesar la solicitud",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAiConfigured) return null;

  return (
    <Button
      type="button"
      onClick={handleSuggest}
      disabled={disabled || loading}
      variant="primary"
      buttonStyle="gradient"
      size="sm"
      loading={loading}
      loadingText={t("common.ai.thinking")}
      icon={Sparkles}
      iconPosition="left"
      rounded="full"
      shadow="sm"
      className={className}
    >
      {t("common.ai.improve") || "Mejorar con IA"}
    </Button>
  );
};

export default AiFieldSuggester;
