import { useAccountsStore } from "@/stores/socialAccountsStore";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useSocialMediaAuth = () => {
  const {
    accounts,
    isLoading,
    error,
    setAccounts,
    setLoading,
    setError,
    removeAccount,
    fetchAccounts,
  } = useAccountsStore();

  // Removing local fetchAccounts in favor of store's fetchAccounts
  // Warning: ensure all consumers of useSocialMediaAuth are compatible with this change or update them.
  // The store's fetchAccounts returns Promise<SocialAccount[]>, which matches the local signature.

  const connectAccount = (platform: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `/social-accounts/auth-url/${platform}`,
          {
            headers: {
              "X-CSRF-TOKEN": document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content"),
              Accept: "application/json",
            },
            withCredentials: true,
          }
        );

        if (response.data.success && response.data.url) {
          const width = 400;
          const height = 600;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const authWindow = window.open(
            response.data.url,
            `${platform}Auth`,
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!authWindow) {
            setLoading(false);
            toast.error("El navegador bloqueó la ventana emergente.");
            resolve(false);
            return;
          }

          const handleMessage = async (event: MessageEvent) => {
            console.log("event");
            console.log(event.data);
            if (
              event.data === "social-auth-success" ||
              event.data?.type === "SOCIAL_AUTH_SUCCESS"
            ) {
              window.removeEventListener("message", handleMessage);
              authWindow.close();

              await fetchAccounts();

              setLoading(false);
              toast.success("Cuenta conectada exitosamente");
              resolve(true);
            }
          };

          window.addEventListener("message", handleMessage);

          const checkWindowClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkWindowClosed);
              window.removeEventListener("message", handleMessage);
              setLoading(false);
              setTimeout(async () => {
                await fetchAccounts();
              }, 1000);
              resolve(false);
            }
          }, 1000);
        } else {
          setLoading(false);
          toast.error("No se pudo obtener la URL de autenticación");
          resolve(false);
        }
      } catch (error: any) {
        setLoading(false);
        const msg = error.response?.data?.message || error.message;
        toast.error("Error al conectar: " + msg);
        setError(msg);
        resolve(false);
      }
    });
  };

  const disconnectAccount = async (id: number, force: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(
        `/social-accounts/${id}${force ? "?force=true" : ""}`,
        {
          headers: {
            "X-CSRF-TOKEN": document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute("content"),
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );
      removeAccount(id);
      await fetchAccounts();

      return { success: true };
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        const msg = err.response.data.message;
        setError(msg);
        return {
          success: false,
          error: msg,
          posts: err.response.data.posts,
        };
      }
      const errorMessage =
        err.response?.data?.message || "Failed to disconnect account";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    accounts,
    isLoading,
    error,
    connectAccount,
    disconnectAccount,
    fetchAccounts,
  };
};
