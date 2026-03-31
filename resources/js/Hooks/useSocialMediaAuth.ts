import { useDisconnectSocialAccount, useSocialAccounts } from '@/Hooks/useSocialAccounts';
import { queryKeys } from '@/lib/queryKeys';
import { ToastService } from '@/Services/ToastService';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const useSocialMediaAuth = () => {
  const { data: accounts = [], isLoading, error } = useSocialAccounts();
  const queryClient = useQueryClient();
  const disconnectMutation = useDisconnectSocialAccount();

  const fetchAccounts = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.socialAccounts.all });

  const connectAccount = (platform: string): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        const response = await axios.get(`/api/v1/social-accounts/auth-url/${platform}`, {
          headers: {
            'X-CSRF-TOKEN': document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute('content'),
            Accept: 'application/json',
          },
          withCredentials: true,
        });

        if (response.data.success && response.data.url) {
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const authWindow = window.open(
            response.data.url,
            `${platform}Auth`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
          );

          if (!authWindow) {
            ToastService.error('El navegador bloqueó la ventana emergente.');
            resolve(false);
            return;
          }

          const handleMessage = async (event: MessageEvent) => {
            const isSuccessEvent =
              event.data === 'social-auth-success' ||
              event.data?.type === 'SOCIAL_AUTH_SUCCESS' ||
              (event.data?.type === 'social_auth_callback' && event.data?.success === true);

            const isErrorEvent =
              event.data?.type === 'social_auth_callback' && event.data?.success === false;

            if (isSuccessEvent) {
              window.removeEventListener('message', handleMessage);
              authWindow.close();
              await fetchAccounts();
              ToastService.success('Cuenta conectada exitosamente');
              resolve(true);
            } else if (isErrorEvent) {
              window.removeEventListener('message', handleMessage);
              authWindow.close();
              const errorMsg = event.data?.message || 'Error al conectar la cuenta';
              if (
                errorMsg.includes('429') ||
                errorMsg.toLowerCase().includes('rate limit') ||
                errorMsg.toLowerCase().includes('too many requests')
              ) {
                ToastService.error(
                  'Twitter/X: Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.',
                );
              } else {
                ToastService.error(errorMsg);
              }
              resolve(false);
            }
          };

          window.addEventListener('message', handleMessage);

          const checkWindowClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkWindowClosed);
              window.removeEventListener('message', handleMessage);
              setTimeout(() => fetchAccounts(), 1000);
              resolve(false);
            }
          }, 1000);
        } else {
          ToastService.error('No se pudo obtener la URL de autenticación');
          resolve(false);
        }
      } catch (error: any) {
        const msg = error.response?.data?.message || error.message;
        ToastService.error('Error al conectar: ' + msg);
        resolve(false);
      }
    });
  };

  const disconnectAccount = async (id: number, force: boolean = false) => {
    try {
      await disconnectMutation.mutateAsync({ id, force });
      return { success: true };
    } catch (err: any) {
      if (err.response?.status === 400) {
        const responseData = err.response.data;
        return {
          success: false,
          error: responseData.message,
          posts: responseData.posts,
          can_disconnect: responseData.can_disconnect,
          reason: responseData.reason,
        };
      }
      const errorMessage = err.response?.data?.message || 'Failed to disconnect account';
      ToastService.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    accounts,
    isLoading,
    error: error?.message ?? null,
    connectAccount,
    disconnectAccount,
    fetchAccounts,
  };
};
