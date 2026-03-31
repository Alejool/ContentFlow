import Button from '@/Components/common/Modern/Button';
import Textarea from '@/Components/common/Modern/Textarea';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Sparkles, Wand2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const aiPromptSchema = (t: (key: string) => string) =>
  z.object({
    prompt: z
      .string()
      .min(10, t('common.ai.prompt_min') || 'El prompt debe tener al menos 10 caracteres')
      .max(500, t('common.ai.prompt_max') || 'El prompt no puede exceder 500 caracteres'),
  });

interface AiPromptSectionProps {
  onSuggest: (data: Record<string, unknown>) => void;
  type: 'publication' | 'campaign';
  currentFields: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
}

const AiPromptSection: React.FC<AiPromptSectionProps> = ({
  onSuggest,
  type,
  currentFields,
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const { auth, ai_enabled } = usePage<{
    auth: {
      user?: {
        ai_settings?: Record<string, { enabled: boolean; api_key: string }>;
        locale?: string;
      };
    };
    ai_enabled: boolean;
  }>().props;
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const isAiConfigured = useMemo(() => {
    if (!ai_enabled) return false;
    const settings = auth.user?.ai_settings || {};
    return Object.values(settings).some((s) => s.enabled && s.api_key);
  }, [auth.user, ai_enabled]);

  const validatePrompt = () => {
    try {
      aiPromptSchema(t).parse({ prompt });
      setError('');
      return true;
    } catch (err) {
      const zodErr = err as ZodError;
      if (zodErr.errors && zodErr.errors[0]) {
        setError(zodErr.errors[0].message);
      }
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading || disabled) return;

    if (!validatePrompt()) return;

    setLoading(true);
    try {
      // Define field limits based on type
      const fieldLimits =
        type === 'publication'
          ? {
              title: { min: 1, max: 70 },
              description: { min: 10, max: 700 },
              goal: { min: 5, max: 200 },
              hashtags: { min: 1, max: 10 },
            }
          : {
              name: { min: 1, max: 100 },
              description: { min: 1, max: 500 },
              goal: { min: 1, max: 200 },
            };

      const response = await axios.post(route('api.v1.ai.suggest-fields'), {
        fields: { ...currentFields, ai_prompt: prompt },
        type,
        language: auth.user?.locale || 'es',
        field_limits: fieldLimits,
      });

      if (response.data.success && response.data.data) {
        onSuggest(response.data.data);

        // Only show success message if there's actual data
        const message = response.data.message;
        if (!message || message === 'OK' || message.trim() === '') {
          toast.success(t('common.ai.suggestions_generated') || 'Sugerencias generadas con éxito', {
            id: 'ai-suggestions',
          });
        } else {
          toast.success(message, { id: 'ai-suggestions' });
        }

        setPrompt('');
        setError('');
      } else {
        toast.error(
          response.data.message ||
            t('common.ai.suggestion_failed') ||
            'No se pudieron generar sugerencias',
        );
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(
        axiosError.response?.data?.message || t('common.error') || 'Error al procesar la solicitud',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAiConfigured) return null;

  return (
    <div
      className={`mb-6 space-y-4 rounded-lg border border-primary-100 bg-primary-50/30 p-4 dark:border-primary-800/50 dark:bg-primary-900/10 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary-100 p-1.5 text-primary-600 dark:bg-primary-800/50 dark:text-primary-400">
          <Wand2 className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
          {t('common.ai.idea_prompt')}
        </span>
      </div>

      <div className="space-y-3">
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) setError('');
          }}
          placeholder={t('common.ai.idea_prompt_placeholder')}
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
          loadingText={t('common.ai.thinking')}
          icon={Sparkles}
          iconPosition="left"
          fullWidth
          shadow="md"
        >
          {t('common.ai.generate')}
        </Button>
      </div>
    </div>
  );
};

export default AiPromptSection;
