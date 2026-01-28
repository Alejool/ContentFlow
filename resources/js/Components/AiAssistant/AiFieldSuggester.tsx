import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Loader2, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
      const response = await axios.post(route("api.v1.ai.suggest-fields"), {
        fields,
        type,
        language: auth.user?.locale || "es",
      });

      if (response.data.success && response.data.data) {
        onSuggest(response.data.data);
        toast.success(
          t("common.ai.suggestions_generated") ||
            "Sugerencias generadas con éxito",
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
    <button
      type="button"
      onClick={handleSuggest}
      disabled={disabled || loading}
      className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 shadow-sm
                ${
                  loading
                    ? "bg-gray-100 dark:bg-neutral-800 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 text-primary-700 dark:text-primary-300 hover:from-primary-100 hover:to-indigo-100 dark:hover:from-primary-900/30 dark:hover:to-indigo-900/30 border border-primary-200/60 dark:border-primary-700/30"
                } ${className}`}
      title={t("common.ai.get_suggestions") || "Obtener sugerencias con IA"}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary-400/10 to-indigo-400/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin relative z-10" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 relative z-10 text-primary-500 group-hover:scale-110 transition-transform" />
      )}
      <span className="relative z-10">
        {loading
          ? t("common.ai.thinking") || "Pensando..."
          : t("common.ai.improve") || "Mejorar con IA"}
      </span>
    </button>
  );
};

export default AiFieldSuggester;
