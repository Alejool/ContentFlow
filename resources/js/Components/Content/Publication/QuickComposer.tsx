import Button from '@/Components/common/Modern/Button';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatformsConfig';
import { useComposerAssistant } from '@/Hooks/Publications/useComposerAssistant';
import { useQuickComposer } from '@/Hooks/Publications/useQuickComposer';
import { CalendarClock, Send, Save, Settings2, Sparkles, X, Zap } from 'lucide-react';
import { useMemo } from 'react';

interface QuickComposerProps {
  onCreated?: () => void;
  onOpenAdvanced?: () => void;
  canPublish: boolean;
}

const MAX_CHARS = 700;

export default function QuickComposer({
  onCreated,
  onOpenAdvanced,
  canPublish,
}: QuickComposerProps) {
  const {
    t,
    form,
    description,
    selectedAccounts,
    socialAccounts,
    isSubmitting,
    toggleAccount,
    saveDraft,
    publishNow,
    scheduleAt,
  } = useQuickComposer({ ...(onCreated ? { onCreated } : {}) });

  const { register, formState } = form;
  const charsLeft = MAX_CHARS - description.length;

  const selectedPlatformNames = useMemo(
    () =>
      [...new Set(
        selectedAccounts
          .map((id) => socialAccounts.find((a) => a.id === id)?.platform)
          .filter(Boolean) as string[],
      )],
    [selectedAccounts, socialAccounts],
  );

  const { suggestion, dismiss } = useComposerAssistant(
    selectedPlatformNames,
    description,
    socialAccounts.length > 0,
  );

  const suggestedTimeLabel = useMemo(() => {
    if (!suggestion?.suggested_time) return '';
    const d = new Date(suggestion.suggested_time);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [suggestion?.suggested_time]);

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-theme-bg-secondary">
      <div className="mb-2 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
          {t('publications.quickComposer.title') || 'Publicación rápida'}
        </h3>
      </div>

      <textarea
        {...register('description')}
        rows={3}
        maxLength={MAX_CHARS}
        placeholder={
          t('publications.quickComposer.placeholder') || '¿Qué quieres publicar hoy?'
        }
        className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 dark:border-neutral-700 dark:bg-black/20 dark:text-white dark:placeholder-neutral-500"
      />

      {suggestion && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2 dark:border-violet-800/60 dark:bg-violet-900/20">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-violet-900 dark:text-violet-200">
              {suggestion.headline}
            </p>
            <p className="mt-0.5 text-xs text-violet-700/80 dark:text-violet-300/70">
              {suggestion.tip} · {suggestion.cta}
            </p>
          </div>
          <button
            type="button"
            onClick={() => scheduleAt(suggestion.suggested_time)}
            disabled={isSubmitting || !formState.isValid || selectedAccounts.length === 0}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {(t('publications.quickComposer.scheduleFor') || 'Programar') + ' ' + suggestedTimeLabel}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('common.close') || 'Cerrar'}
            className="shrink-0 rounded p-1 text-violet-400 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/40"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Account chips */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {socialAccounts.map((account) => {
            const platform =
              SOCIAL_PLATFORMS[account.platform?.toLowerCase() as keyof typeof SOCIAL_PLATFORMS];
            const Icon = platform?.icon;
            const selected = selectedAccounts.includes(account.id);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => toggleAccount(account.id)}
                title={account.account_name || account.platform}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  selected
                    ? 'border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'border-gray-200 bg-white text-gray-500 opacity-60 hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span className="max-w-24 truncate">
                  {account.account_name || account.platform}
                </span>
              </button>
            );
          })}
          {socialAccounts.length === 0 && (
            <a
              href="?section=social"
              className="text-xs font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
            >
              {t('publications.quickComposer.connectAccounts') || 'Conecta tus redes para publicar →'}
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center justify-end gap-2">
          <span
            className={`text-xs tabular-nums ${
              charsLeft < 50 ? 'text-amber-500' : 'text-gray-400 dark:text-neutral-500'
            }`}
          >
            {charsLeft}
          </span>

          {onOpenAdvanced && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenAdvanced}
              title={t('publications.quickComposer.advanced') || 'Opciones avanzadas'}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            buttonStyle="outline"
            size="sm"
            icon={<Save className="h-4 w-4" />}
            disabled={isSubmitting || !formState.isValid}
            onClick={saveDraft}
          >
            {t('publications.quickComposer.draft') || 'Borrador'}
          </Button>

          {canPublish && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Send className="h-4 w-4" />}
              disabled={isSubmitting || !formState.isValid || selectedAccounts.length === 0}
              loading={isSubmitting}
              onClick={publishNow}
            >
              {t('publications.button.publishNow') || 'Publicar ahora'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
