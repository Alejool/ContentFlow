import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface PlatformCapabilities {
  video_duration_limit?: number;
  long_uploads_allowed?: boolean;
  max_file_size_mb?: number;
  supports_shorts?: boolean;
  supports_live?: boolean;
  is_premium?: boolean;
  is_verified?: boolean;
  verified_type?: string;
  is_business_account?: boolean;
  account_type?: string;
  supports_reels?: boolean;
  supports_stories?: boolean;
  supports_igtv?: boolean;
  supports_long_tweets?: boolean;
  supports_photo_mode?: boolean;
  channel_id?: string;
}

export interface AccountCapabilities {
  account_id: number;
  platform: string;
  account_name: string;
  capabilities: PlatformCapabilities;
}

export interface VideoValidationError {
  type: string;
  message: string;
  limit?: number;
  actual?: number;
}

export interface VideoValidationWarning {
  type: string;
  message: string;
}

export interface VideoValidationResult {
  account_id: number;
  platform: string;
  account_name: string;
  valid: boolean;
  errors: VideoValidationError[];
  warnings: VideoValidationWarning[];
  capabilities: PlatformCapabilities;
}

/**
 * Get capabilities for all accounts in workspace
 */
export const useAccountsCapabilities = () => {
  return useQuery<AccountCapabilities[]>({
    queryKey: queryKeys.socialAccounts.capabilities(),
    queryFn: async () => {
      const response = await axios.get('/api/v1/social-accounts/capabilities');
      return response.data.accounts;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
};

/**
 * Get capabilities for a specific account
 */
export const useAccountCapabilities = (accountId: number | null) => {
  return useQuery<AccountCapabilities>({
    queryKey: queryKeys.socialAccounts.capabilities(accountId),
    queryFn: async () => {
      const response = await axios.get(`/api/v1/social-accounts/capabilities/${accountId}`);
      return response.data;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
};

/**
 * Refresh capabilities for a specific account
 */
export const useRefreshAccountCapabilities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: number) => {
      const response = await axios.post(
        `/api/v1/social-accounts/capabilities/${accountId}/refresh`,
      );
      return response.data;
    },
    onSuccess: (data, accountId) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.socialAccounts.capabilities() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.socialAccounts.capabilities(accountId),
      });
      toast.success('Account capabilities updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update capabilities');
    },
  });
};

/**
 * Validate video for multiple accounts
 */
export const useValidateVideo = () => {
  return useMutation<
    { valid: boolean; results: VideoValidationResult[] },
    Error,
    { accountIds: number[]; videoDuration: number; fileSizeMb: number }
  >({
    mutationFn: async ({ accountIds, videoDuration, fileSizeMb }) => {
      const response = await axios.post('/api/v1/social-accounts/capabilities/validate-video', {
        account_ids: accountIds,
        video_duration: videoDuration,
        file_size_mb: fileSizeMb,
      });
      return response.data;
    },
  });
};

/**
 * Helper hook to get capabilities for selected accounts
 */
export const useSelectedAccountsCapabilities = (selectedAccountIds: number[]) => {
  const { data: allCapabilities, isLoading } = useAccountsCapabilities();

  const selectedCapabilities = allCapabilities?.filter((cap) =>
    selectedAccountIds.includes(cap.account_id),
  );

  return {
    capabilities: selectedCapabilities || [],
    isLoading,
  };
};

/**
 * Helper to format duration limit in human-readable format
 */
export const formatDurationLimit = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
  }

  return `${minutes} minutes`;
};

/**
 * Helper to format file size limit
 */
export const formatFileSizeLimit = (mb: number): string => {
  if (mb >= 1024) {
    const gb = (mb / 1024).toFixed(1);
    return `${gb} GB`;
  }
  return `${mb} MB`;
};

/**
 * Get platform-specific upgrade message
 */
export const getUpgradeMessage = (
  platform: string,
  capabilities: PlatformCapabilities,
): string | null => {
  switch (platform) {
    case 'youtube':
      if (!capabilities.long_uploads_allowed) {
        return 'Verifica tu canal de YouTube con un número de teléfono para subir videos de más de 15 minutos (hasta 12 horas).';
      }
      break;
    case 'twitter':
    case 'x':
      if (!capabilities.is_premium) {
        return 'Actualiza a Twitter Blue/Premium para subir videos de hasta 10 minutos (o 3 horas con Premium+).';
      }
      break;
    case 'tiktok':
      if (!capabilities.is_business_account) {
        return 'Considera actualizar a una cuenta TikTok Business para funciones extendidas.';
      }
      break;
  }
  return null;
};
