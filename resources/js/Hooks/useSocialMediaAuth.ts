import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useCampaignManagement } from "@/Hooks/useCampaignManagement";

export const useSocialMediaAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const { fetchCampaigns } = useCampaignManagement();


  const fetchAccounts = async () => {
    try {
      const response = await axios.get("/social-accounts", {
        headers: {
          "X-CSRF-TOKEN": document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content"),
          Accept: "application/json",
        },
        withCredentials: true,
      });

      if (response.data && response.data.accounts) {
        setAccounts(response.data.accounts);
        return response.data.accounts;
      }
      return [];
    } catch (error) {
      console.error("Error al cargar cuentas sociales:", error);
      return [];
    }
  };

  const connectAccount = (platform: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsLoading(true);
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
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const authWindow = window.open(
            response.data.url,
            `${platform}Auth`,
            `width=${width},height=${height},left=${left},top=${top}`
          );

          if (!authWindow) {
            setIsLoading(false);
            toast.error("El navegador bloqueó la ventana emergente.");
            resolve(false);
            return;
          }

          const handleMessage = async (event: MessageEvent) => {
            if (
              event.data === "social-auth-success" ||
              event.data?.type === "SOCIAL_AUTH_SUCCESS"
            ) {
              window.removeEventListener("message", handleMessage);
              // authWindow.close(); // Optional: popup usually closes itself
              setIsLoading(false);
              toast.success("Cuenta conectada exitosamente");
              await fetchAccounts(); 
              // await fetchCampaigns();
              resolve(true);
            }
          };

          window.addEventListener("message", handleMessage);

          const checkWindowClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkWindowClosed);
              window.removeEventListener("message", handleMessage);
              setIsLoading(false);
              // Resolve false if closed without success message
              resolve(false);
            }
          }, 1000);
        } else {
          setIsLoading(false);
          toast.error("No se pudo obtener la URL de autenticación");
          resolve(false);
        }
      } catch (error: any) {
        setIsLoading(false);
        const msg = error.response?.data?.message || error.message;
        toast.error("Error al conectar: " + msg);
        setError(msg);
        resolve(false); // Resolve false instead of throw to prevent crash
      }
    });
  };

  const disconnectAccount = async (id: number, force: boolean = false) => {
    setIsLoading(true);
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
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      // await fetchCampaigns();
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
      setIsLoading(false);
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
