import Input from '@/Components/common/Modern/Input';
import { useTheme } from '@/Hooks/useTheme';
import { BrainCircuit, ExternalLink, Info, Key, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Modelos Gemini 2.0 Flash y Pro.',
      link: 'https://aistudio.google.com/app/apikey',
      placeholder: 'AIzaSy...',
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'Económico y potente, ideal para texto.',
      link: 'https://platform.deepseek.com/api_keys',
      placeholder: 'sk-...',
    },
    {
      id: 'openai',
      name: 'OpenAI (ChatGPT)',
      description: 'GPT-4o y GPT-3.5 Turbo.',
      link: 'https://platform.openai.com/api-keys',
      placeholder: 'sk-...',
    },
  ];

  const handleToggleProvider = (providerId: string, enabled: boolean) => {
    const currentSettings = watchedValues.ai_settings || {};
    setValue(
      'ai_settings',
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
      'ai_settings',
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
        <div className="mb-2 flex items-center gap-4">
          <div className="rounded-lg border border-primary-500/20 bg-primary-500/10 p-2.5 text-primary-600 dark:text-primary-400">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {t('profile.ai.title') || 'Configuración de IA Personal'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {t('profile.ai.description') ||
                'Configura tus propias claves de API para habilitar funciones inteligentes personalizadas.'}
            </p>
          </div>
        </div>
      </header>

      <div className="mb-8 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-900/10">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t('profile.ai.hint') ||
            'Si configuras un proveedor aquí, el sistema usará tu clave personal en lugar de la predeterminada del sistema. Esto te da más control sobre el uso y las capacidades.'}
        </p>
      </div>

      <div className="space-y-6">
        {providers.map((provider) => {
          const config = watchedValues.ai_settings?.[provider.id] || {};
          const isEnabled = config.enabled || false;

          return (
            <div
              key={provider.id}
              className={`group rounded-lg border p-6 transition-all duration-300 ${
                isEnabled
                  ? 'border-primary-500/30 bg-white shadow-md ring-1 ring-primary-500/10 dark:bg-neutral-800/60'
                  : 'border-gray-200 bg-gray-50/50 opacity-80 dark:border-neutral-800 dark:bg-neutral-900/30'
              } `}
            >
              <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-lg p-3 transition-colors ${
                      isEnabled
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30'
                        : 'bg-gray-200 text-gray-400 dark:bg-neutral-800'
                    }`}
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{provider.name}</h3>
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
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary-500 transition-colors hover:text-primary-600"
                  >
                    {t('profile.ai.get_key') || 'Obtener Clave'}
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleProvider(provider.id, !isEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-neutral-700'} `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      {...register(`ai_settings.${provider.id}.enabled`)}
                    />
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'} `}
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
                      label={t('profile.ai.api_key_label') || 'API Key'}
                      placeholder={provider.placeholder}
                      register={register}
                      name={`ai_settings.${provider.id}.api_key`}
                      error={errors?.ai_settings?.[provider.id]?.api_key?.message}
                      icon={Key}
                      variant="filled"
                      sizeType="md"
                      showPasswordToggle
                      containerClassName="max-w-xl"
                    />
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {t('profile.ai.secured_storage') || 'Almacenamiento Seguro Encriptado'}
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
