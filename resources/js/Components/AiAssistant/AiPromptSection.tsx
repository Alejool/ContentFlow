import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Textarea from "@/Components/common/Modern/Textarea";
import Button from "@/Components/common/Modern/Button";
import { z } from "zod";

const aiPromptSchema = (t: any) =>
  z.object({
    prompt: z
      .string()
      .min(10, t("common.ai.prompt_min") || "El prompt debe tener al menos 10 caracteres")
      .max(500, t("common.ai.prompt_max") || "El prompt no puede exceder 500 caracteres"),
  });

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
  const [error, setError] = useState<string>("");

  const isAiConfigured = useMemo(() => {
    if (!ai_enabled) return false;
    const settings = auth.user?.ai_settings || {};
    return Object.values(settings).some((s: any) => s.enabled && s.api_key);
  }, [auth.user, ai_enabled]);

  const validatePrompt = () => {
    try {
      aiPromptSchema(t).parse({ prompt });
      setError("");
      return true;
    } catch (err: any) {
      if (err.errors && err.errors[0]) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading || disabled) return;

    if (!validatePrompt()) return;

    setLoading(true);
    try {
      // Calculate default dates for campaigns
      const today = new Date();
      const twoDaysLater = new Date(today);
      twoDaysLater.setDate(today.getDate() + 2);
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

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
        fields: { ...currentFields, ai_prompt: prompt },
        type,
        language: auth.user?.locale || "es",
        field_limits: fieldLimits,
      });

      if (response.data.success && response.data.data) {
        onSuggest(response.data.data);
        
        // Only show success message if there's actual data
        const message = response.data.message;
        if (!message || message === "OK" || message.trim() === "") {
          toast.success(
            t("common.ai.suggestions_generated") ||
              "Sugerencias generadas con éxito",
            { id: "ai-suggestions" }
          );
        } else {
          toast.success(message, { id: "ai-suggestions" });
        }
        
        setPrompt("");
        setError("");
      } else {
        toast.error(
          response.data.message ||
            t("common.ai.suggestion_failed") ||
            "No se pudieron generar sugerencias",
        );
      }
    } catch (error: any) {
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
      className={`p-4 bg-primary-50/30 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-lg space-y-4 mb-6 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary-100 dark:bg-primary-800/50 rounded-lg text-primary-600 dark:text-primary-400">
          <Wand2 className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
          {t("common.ai.idea_prompt")}
        </span>
      </div>

      <div className="space-y-3">
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) setError("");
          }}
          placeholder={t("common.ai.idea_prompt_placeholder")}
          variant="filled"
          size="md"
          rows={3}
          maxLength={500}
          showCharCount
          disabled={disabled || loading}
          error={error}
          className="text-sm"
        />
        
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading || disabled}
          variant="primary"
          buttonStyle="gradient"
          size="md"
          loading={loading}
          loadingText={t("common.ai.thinking")}
          icon={Sparkles}
          iconPosition="left"
          fullWidth
          shadow="md"
        >
          {t("common.ai.generate")}
        </Button>
      </div>
    </div>
  );
};

export default AiPromptSection;
