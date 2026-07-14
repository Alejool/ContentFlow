import { useSocialAccounts } from '@/Hooks/ConfigSocialMedia/useSocialAccounts';
import { queryKeys } from '@/lib/common/queryKeys';
import { publicationService } from '@/Services/Publications/publicationService';
import type { QuickComposerData } from '@/schemas/Publications/publication';
import { quickComposerSchema } from '@/schemas/Publications/publication';
import { readLastAccounts, saveLastAccounts } from '@/Utils/Publications/lastAccounts';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePage } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface UseQuickComposerProps {
  onCreated?: () => void;
}

export const useQuickComposer = ({ onCreated }: UseQuickComposerProps = {}) => {
  const { t } = useTranslation();
  const { props } = usePage<any>();
  const workspaceId = props.auth?.user?.current_workspace_id;
  const { data: socialAccounts = [], isLoading: isLoadingAccounts } = useSocialAccounts();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuickComposerData>({
    resolver: zodResolver(
      quickComposerSchema(t as unknown as (key: string, ...args: unknown[]) => string),
    ),
    mode: 'onChange',
    defaultValues: { description: '', social_accounts: [] },
  });

  const { control, setValue, getValues, handleSubmit, reset, formState } = form;
  const description = useWatch({ control, name: 'description' }) || '';
  const selectedAccounts = useWatch({ control, name: 'social_accounts' }) || [];

  // Preselect the accounts used on the last publication once accounts load.
  useEffect(() => {
    if (socialAccounts.length === 0 || getValues('social_accounts').length > 0) return;
    const stored = readLastAccounts(workspaceId).filter((id) =>
      socialAccounts.some((a) => a.id === id),
    );
    if (stored.length > 0) {
      setValue('social_accounts', stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socialAccounts.length, workspaceId]);

  const toggleAccount = (id: number) => {
    const current = getValues('social_accounts');
    setValue(
      'social_accounts',
      current.includes(id) ? current.filter((a) => a !== id) : [...current, id],
      { shouldValidate: true },
    );
  };

  const buildFormData = (data: QuickComposerData, scheduledAt?: string): FormData => {
    const fd = new FormData();
    // Backend derives the title from the description when empty
    fd.append('title', '');
    fd.append('description', data.description);
    fd.append('content_type', 'post');
    fd.append('status', scheduledAt ? 'scheduled' : 'draft');
    if (scheduledAt) {
      fd.append('scheduled_at', scheduledAt);
    }
    fd.append('social_accounts_sync', 'true');
    if (data.social_accounts.length === 0) {
      fd.append('clear_social_accounts', '1');
      fd.append('social_accounts', JSON.stringify([]));
    } else {
      data.social_accounts.forEach((id, i) => fd.append(`social_accounts[${i}]`, id.toString()));
    }
    return fd;
  };

  const submit = (mode: 'draft' | 'publish' | 'schedule', scheduledAt?: string) =>
    handleSubmit(async (data: QuickComposerData) => {
      if (mode !== 'draft' && data.social_accounts.length === 0) {
        toast.error(
          t('publications.quickComposer.accountsRequired') ||
            'Selecciona al menos una red para publicar',
        );
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await publicationService.create(
          buildFormData(data, mode === 'schedule' ? scheduledAt : undefined),
        );
        const pubId = (result as any)?.id || (result as any)?.publication?.id;

        saveLastAccounts(workspaceId, data.social_accounts);

        if (mode === 'publish' && pubId) {
          const publishFd = new FormData();
          data.social_accounts.forEach((id) => publishFd.append('platforms[]', id.toString()));
          await publicationService.publish(pubId, publishFd);
          toast.success(
            t('publications.messages.publishStarted') || 'Publicando en las redes seleccionadas…',
          );
        } else if (mode === 'schedule') {
          toast.success(
            t('publications.quickComposer.scheduled') || 'Publicación programada',
          );
        } else {
          toast.success(t('publications.messages.createSuccess'));
        }

        reset({ description: '', social_accounts: data.social_accounts });
        queryClient.invalidateQueries({ queryKey: queryKeys.publications.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
        onCreated?.();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || t('publications.messages.error') || 'Error al guardar',
        );
      } finally {
        setIsSubmitting(false);
      }
    })();

  return {
    t,
    form,
    description,
    selectedAccounts,
    socialAccounts,
    isLoadingAccounts,
    isSubmitting,
    isValid: formState.isValid,
    toggleAccount,
    saveDraft: () => submit('draft'),
    publishNow: () => submit('publish'),
    scheduleAt: (iso: string) => submit('schedule', iso),
  };
};
