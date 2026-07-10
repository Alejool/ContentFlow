import Button from '@/Components/common/Modern/Button';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatformsConfig';
import { useQuickComposer } from '@/Hooks/Publications/useQuickComposer';
import { Send, Save, Settings2, Zap } from 'lucide-react';

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
  } = useQuickComposer({ ...(onCreated ? { onCreated } : {}) });

  const { register, formState } = form;
  const charsLeft = MAX_CHARS - description.length;

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
            <span className="text-xs text-gray-400 dark:text-neutral-500">
              {t('publications.quickComposer.noAccounts') || 'Sin redes conectadas'}
            </span>
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
