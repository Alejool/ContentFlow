import { queryKeys } from '@/lib/queryKeys';
import { SocialAccount } from '@/types/SocialAccount';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

async function fetchSocialAccountsFn(): Promise<SocialAccount[]> {
  const response = await axios.get('/api/v1/social-accounts');
  const accounts = response.data.accounts || [];
  return accounts.map((acc: SocialAccount) => ({ ...acc, account_name: acc.account_name }));
}

export function useSocialAccounts() {
  return useQuery({
    queryKey: queryKeys.socialAccounts.all,
    queryFn: fetchSocialAccountsFn,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDisconnectSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force = false }: { id: number; force?: boolean }) =>
      axios.delete(`/api/v1/social-accounts/${id}${force ? '?force=true' : ''}`, {
        headers: {
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content'),
          Accept: 'application/json',
        },
        withCredentials: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialAccounts.all });
    },
  });
}
