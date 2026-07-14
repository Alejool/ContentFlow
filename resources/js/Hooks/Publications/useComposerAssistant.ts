import { aiAssistantService } from '@/Services/AI/aiAssistantService';
import type { ComposerSuggestion } from '@/Services/AI/aiAssistantService';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Fetches the AI guidance shown in the QuickComposer: best time to publish
 * for this workspace plus a nudge to act. One request per platform set,
 * cached 10 minutes — the draft is only sent on the initial fetch to avoid
 * hammering the endpoint on every keystroke.
 */
export const useComposerAssistant = (platforms: string[], draft: string, enabled: boolean) => {
  const { i18n } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const key = [...platforms].sort().join(',');

  const query = useQuery<ComposerSuggestion>({
    queryKey: ['composer-assistant', key],
    queryFn: () =>
      aiAssistantService
        .composerAssistant({
          platforms,
          ...(draft ? { draft } : {}),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: i18n.language?.startsWith('en') ? 'en' : 'es',
        })
        .then((r) => r.data),
    enabled: enabled && !dismissed,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return {
    suggestion: dismissed ? undefined : query.data,
    isLoading: query.isLoading,
    dismiss: () => setDismissed(true),
  };
};
