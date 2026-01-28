import Input from "@/Components/common/Modern/Input";
import { useTheme } from "@/Hooks/useTheme";
import {
  BrainCircuit,
  ExternalLink,
  Info,
  Key,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface AiConfigSectionProps {
  watchedValues: any;
  setValue: any;
  register: any;
  errors: any;
  isSubmitting: boolean;
}

export default function AiConfigSection({
  watchedValues,
  setValue,
  register,
  errors,
  isSubmitting,
}: AiConfigSectionProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const providers = [
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Modelos Gemini 2.0 Flash y Pro.",
      link: "https://aistudio.google.com/app/apikey",
      placeholder: "AIzaSy...",
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      description: "Económico y potente, ideal para texto.",
      link: "https://platform.deepseek.com/api_keys",
      placeholder: "sk-...",
    },
    {
      id: "openai",
      name: "OpenAI (ChatGPT)",
      description: "GPT-4o y GPT-3.5 Turbo.",
      link: "https://platform.openai.com/api-keys",
      placeholder: "sk-...",
    },
  ];

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    const currentSettings = watchedValues.ai_settings || {};
    setValue(
      "ai_settings",
      {
        ...currentSettings,
        [providerId]: {
          ...(currentSettings[providerId] || {}),
          enabled,
        },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleKeyChange = (providerId: string, value: string) => {
    const currentSettings = watchedValues.ai_settings || {};
    setValue(
      "ai_settings",
      {
        ...currentSettings,
        [providerId]: {
          ...(currentSettings[providerId] || {}),
          api_key: value,
        },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t("profile.ai.title") || "Configuración de IA Personal"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {t("profile.ai.description") ||
                "Configura tus propias claves de API para habilitar funciones inteligentes personalizadas."}
            </p>
          </div>
        </div>
      </header>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 mb-8 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t("profile.ai.hint") ||
            "Si configuras un proveedor aquí, el sistema usará tu clave personal en lugar de la predeterminada del sistema. Esto te da más control sobre el uso y las capacidades."}
        </p>
      </div>

      <div className="space-y-6">
        {providers.map((provider) => {
          const config = watchedValues.ai_settings?.[provider.id] || {};
          const isEnabled = config.enabled || false;

          return (
            <div
              key={provider.id}
              className={`
                group p-6 rounded-lg border transition-all duration-300
                ${
                  isEnabled
                    ? "bg-white dark:bg-neutral-800/60 border-primary-500/30 shadow-md ring-1 ring-primary-500/10"
                    : "bg-gray-50/50 dark:bg-neutral-900/30 border-gray-200 dark:border-neutral-800 opacity-80"
                }
              `}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg transition-colors ${
                      isEnabled
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600"
                        : "bg-gray-200 dark:bg-neutral-800 text-gray-400"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-neutral-500">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <a
                    href={provider.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold uppercase tracking-widest text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
                  >
                    {t("profile.ai.get_key") || "Obtener Clave"}
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleProvider(provider.id, !isEnabled)
                    }
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${isEnabled ? "bg-primary-600" : "bg-gray-300 dark:bg-neutral-700"}
                    `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      {...register(`ai_settings.${provider.id}.enabled`)}
                    />
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${isEnabled ? "translate-x-6" : "translate-x-1"}
                      `}
                    />
                  </button>
                </div>
              </div>

              {isEnabled && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative">
                    <Input
                      id={`ai_key_${provider.id}`}
                      type="password"
                      label={t("profile.ai.api_key_label") || "API Key"}
                      placeholder={provider.placeholder}
                      register={register}
                      name={`ai_settings.${provider.id}.api_key`}
                      error={
                        errors?.ai_settings?.[provider.id]?.api_key?.message
                      }
                      icon={Key}
                      variant="filled"
                      sizeType="md"
                      showPasswordToggle
                      containerClassName="max-w-xl"
                    />
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t("profile.ai.secured_storage") ||
                        "Almacenamiento Seguro Encriptado"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
