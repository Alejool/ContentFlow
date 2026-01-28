import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface AiPromptSectionProps {
  onSuggest: (data: any) => void;
  type: "publication" | "campaign";
  currentFields: Record<string, any>;
  disabled?: boolean;
  className?: string;
}

const AiPromptSection: React.FC<AiPromptSectionProps> = ({
  onSuggest,
  type,
  currentFields,
  disabled = false,
  className = "",
}) => {
  const { t } = useTranslation();
  const { auth, ai_enabled } = usePage<any>().props;
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const isAiConfigured = useMemo(() => {
    if (!ai_enabled) return false;
    const settings = auth.user?.ai_settings || {};
    return Object.values(settings).some((s: any) => s.enabled && s.api_key);
  }, [auth.user, ai_enabled]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading || disabled) return;

    setLoading(true);
    try {
      const response = await axios.post(route("api.v1.ai.suggest-fields"), {
        fields: { ...currentFields, ai_prompt: prompt },
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
      console.error("AI Generation Error:", error);
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
    <div
      className={`p-4 bg-primary-50/30 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-2xl space-y-4 mb-6 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary-100 dark:bg-primary-800/50 rounded-lg text-primary-600 dark:text-primary-400">
          <Wand2 className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
          {t("common.ai.idea_prompt")}
        </span>
      </div>

      <div className="relative group">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("common.ai.idea_prompt_placeholder")}
          className="w-full min-h-[80px] p-4 text-sm bg-white/50 dark:bg-neutral-800/50 border border-primary-200/50 dark:border-primary-700/30 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all resize-none placeholder-gray-400 dark:placeholder-gray-500"
          disabled={disabled || loading}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading || disabled}
          className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:bg-gray-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-primary-500/20"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {loading ? t("common.ai.thinking") : t("common.ai.generate")}
        </button>
      </div>
    </div>
  );
};

export default AiPromptSection;
