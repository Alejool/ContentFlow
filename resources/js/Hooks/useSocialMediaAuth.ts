import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";

export const useSocialMediaAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  
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

  const connectAccount = async (platform: string) => {
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
        const authWindow = window.open(
          response.data.url,
          `${platform}Auth`,
          "width=600,height=700,left=200,top=100"
        );

        if (!authWindow) {
          setIsLoading(false);
          toast.error("El navegador bloqueó la ventana emergente.");
          return false;
        }

        const checkWindowClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkWindowClosed);
            setIsLoading(false);
          }
        }, 1000);

        return true;
      } else {
        setIsLoading(false);
        toast.error("No se pudo obtener la URL de autenticación");
        return false;
      }
    } catch (error: any) {
      setIsLoading(false);
      const msg = error.response?.data?.message || error.message;
      toast.error("Error al conectar: " + msg);
      setError(msg);
      throw error;
    }
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
