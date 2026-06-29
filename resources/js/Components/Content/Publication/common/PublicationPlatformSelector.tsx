/**
 * INTEGRACIÓN: Componente para mostrar validación de plataformas
 * 
 * Muestra claramente qué plataformas soportan el tipo de contenido actual
 * y cuáles no, con razones específicas.
 */

import { AlertCircle, Check, X, Lock } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import type { SocialAccount } from '@/types/Content/socialAccounts';

interface PlatformValidation {
  platform: string;
  platform_label: string;
  compatible: boolean;
  reasons: string[];
  is_editable: boolean;
  edit_reasons: string[];
  capabilities: Record<string, any>;
  specs?: Record<string, any>;
  rules?: Record<string, any>;
}

interface PlatformValidationStatus {
  can_publish_to_any: boolean;
  compatible_count: number;
  incompatible_count: number;
  compatible_platforms: string[];
  incompatible_platforms: string[];
  platforms: Record<string, PlatformValidation>;
  user_plan: string;
  content_type: string;
  is_published: boolean;
  publication_id?: number;
}

interface PublicationPlatformSelectorProps {
  contentType: string;
  selectedAccounts: SocialAccount[];
  socialAccounts: SocialAccount[];
  publicationId?: number;
  isPublished?: boolean;
  onAccountToggle: (accountId: number) => void;
  disabled?: boolean;
  t?: (key: string, fallback?: string) => string;
}

const PublicationPlatformSelector = memo<PublicationPlatformSelectorProps>(
  ({
    contentType,
    selectedAccounts,
    socialAccounts,
    publicationId,
    isPublished = false,
    onAccountToggle,
    disabled = false,
    t = (key, fallback) => fallback || key,
  }) => {
    const [validationStatus, setValidationStatus] = useState<PlatformValidationStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validar cuando cambia el tipo de contenido o cuentas seleccionadas
    useEffect(() => {
      if (!socialAccounts.length) return;

      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        content_type: contentType,
        social_account_ids: selectedAccounts.map(a => a.id.toString()).join(','),
        ...(publicationId && { publication_id: publicationId.toString() }),
      });

      fetch(`/api/publications/validate-platforms?${params}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setValidationStatus(res.data);
          } else {
            setError(res.message || 'Error al validar plataformas');
          }
        })
        .catch(err => {
          console.error('Validation error:', err);
          setError('Error al conectar con el servidor');
        })
        .finally(() => setLoading(false));
    }, [contentType, selectedAccounts, publicationId]);

    if (!validationStatus) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Resumen de compatibilidad */}
        <div className="rounded-lg border bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                {t('publications.platformValidation.title', 'Compatibilidad de Plataformas')}
              </h3>
              <p className="mt-1 text-xs text-gray-600 dark:text-neutral-400">
                {validationStatus.compatible_count > 0
                  ? `${validationStatus.compatible_count} plataforma(s) compatible(s)`
                  : 'No hay plataformas compatibles'}
                {validationStatus.incompatible_count > 0 && ` · ${validationStatus.incompatible_count} no compatible(s)`}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de plataformas */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(validationStatus.platforms).map((validation) => (
            <PlatformCard
              key={validation.platform}
              validation={validation}
              isSelected={selectedAccounts.some(a => a.platform === validation.platform)}
              isPublished={isPublished}
              disabled={disabled || !validation.compatible}
              onToggleSelect={() => {
                // Toggle all accounts for this platform
                const platformAccounts = socialAccounts.filter(a => a.platform === validation.platform);
                const allSelected = platformAccounts.every(acc =>
                  selectedAccounts.some(s => s.id === acc.id)
                );
                platformAccounts.forEach(acc => {
                  if (allSelected && selectedAccounts.some(s => s.id === acc.id)) {
                    onAccountToggle(acc.id);
                  } else if (!allSelected && !selectedAccounts.some(s => s.id === acc.id)) {
                    onAccountToggle(acc.id);
                  }
                });
              }}
              t={t}
            />
          ))}
        </div>

        {/* Advertencias y restricciones */}
        {isPublished && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  {t('publications.platformValidation.publishedWarning', 'Publicación Activa')}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {t(
                    'publications.platformValidation.publishedWarningDesc',
                    'No puedes cambiar el tipo de contenido de una publicación activa o agendada.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

/**
 * Tarjeta individual de plataforma
 */
interface PlatformCardProps {
  validation: PlatformValidation;
  isSelected: boolean;
  isPublished: boolean;
  disabled: boolean;
  onToggleSelect: () => void;
  t?: (key: string, fallback?: string) => string;
}

const PlatformCard = memo<PlatformCardProps>(
  ({ validation, isSelected, isPublished, disabled, onToggleSelect, t = k => k }) => {
    const baseClasses = 'rounded-lg border p-3 transition-all cursor-pointer';
    const compatibleClasses = validation.compatible
      ? 'border-green-200 bg-green-50 hover:border-green-300 dark:border-green-900/50 dark:bg-green-900/20'
      : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20';

    return (
      <div
        className={`${baseClasses} ${compatibleClasses} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onToggleSelect()}
      >
        <div className="flex items-start gap-2">
          <div className="pt-0.5">
            {validation.compatible ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${
              validation.compatible
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {validation.platform_label}
            </h4>

            {validation.compatible && (
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                ✓ Soporta {validation.compatible ? validation.compatible : 'este tipo de contenido'}
              </p>
            )}

            {validation.reasons.length > 0 && (
              <ul className="mt-2 space-y-1">
                {validation.reasons.map((reason, idx) => (
                  <li key={idx} className={`text-xs ${
                    validation.compatible
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    • {reason}
                  </li>
                ))}
              </ul>
            )}

            {isPublished && !validation.is_editable && (
              <div className="mt-2 rounded bg-amber-100/50 px-2 py-1 dark:bg-amber-900/30">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  🔒 No editable (publicada)
                </p>
              </div>
            )}

            {validation.specs && (
              <div className="mt-2 space-y-1 border-t border-opacity-20 pt-2">
                {validation.specs.video && (
                  <PlatformSpec
                    icon="🎥"
                    label="Video"
                    specs={validation.specs.video}
                  />
                )}
                {validation.specs.image && (
                  <PlatformSpec
                    icon="🖼️"
                    label="Imagen"
                    specs={validation.specs.image}
                  />
                )}
              </div>
            )}
          </div>

          {validation.compatible && (
            <div className="pt-0.5">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="h-4 w-4"
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

/**
 * Especificaciones de plataforma
 */
interface PlatformSpecProps {
  icon: string;
  label: string;
  specs: Record<string, any>;
}

const PlatformSpec = memo<PlatformSpecProps>(({ icon, label, specs }) => {
  const specItems = [];

  if (specs.max_size_mb) {
    specItems.push(`${specs.max_size_mb}MB máx`);
  }
  if (specs.max_duration_seconds) {
    specItems.push(`${specs.max_duration_seconds}s máx`);
  }
  if (specs.aspect_ratios?.length) {
    specItems.push(`${specs.aspect_ratios.join(', ')}`);
  }

  return (
    <p className="text-xs text-gray-600 dark:text-neutral-400">
      <span className="mr-1">{icon}</span>
      <span className="font-medium">{label}:</span> {specItems.join(', ') || 'Soportado'}
    </p>
  );
});

PlatformSpec.displayName = 'PlatformSpec';
PlatformCard.displayName = 'PlatformCard';
PublicationPlatformSelector.displayName = 'PublicationPlatformSelector';

export default PublicationPlatformSelector;
export type { PlatformValidationStatus, PublicationPlatformSelectorProps };
