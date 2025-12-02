import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useSocialMediaAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    // Escuchar mensajes de la ventana emergente
    const handleMessage = async (event) => {
      console.log("Mensaje recibido:", event.data);

      if (event.data && event.data.type === "social_auth_callback") {
        setIsAuthenticating(false);

        if (event.data.success) {
          // La autenticación fue exitosa
          console.log("Autenticación exitosa:", event.data.data);

          try {
            // Parsear los datos recibidos del callback
            const responseData = JSON.parse(event.data.data);
            console.log("Datos parseados:", responseData);

            // Guardar los datos en el backend
            await axios.post(
              "/api/social-accounts",
              {
                platform: responseData.platform,
                account_id: responseData.account_id,
                access_token: responseData.access_token,
                refresh_token: responseData.refresh_token || null,
                token_expires_at: responseData.token_expires_at || null,
              },
              {
                headers: {
                  "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content"),
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              }
            );

            toast.success(
              `Cuenta de ${responseData.platform} conectada exitosamente`
            );

            // Recargar las cuentas conectadas
            await loadConnectedAccounts();
          } catch (error) {
            console.error("Error al guardar datos de la cuenta:", error);
            toast.error(
              "Error al guardar los datos de la cuenta: " +
                (error.response?.data?.message || error.message)
            );
          }
        } else {
          // La autenticación falló
          console.error("Error en la autenticación:", event.data.message);
          toast.error(
            "Error en la autenticación: " +
              (event.data.message || "Error desconocido")
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Cargar cuentas conectadas del usuario
  const loadConnectedAccounts = async () => {
    try {
      const response = await axios.get("/api/social-accounts", {
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
      toast.error("No se pudieron cargar las cuentas conectadas");
      return [];
    }
  };

  const connectSocialMedia = async (platform) => {
    try {
      setIsAuthenticating(true);

      // Obtener URL de autenticación
      const response = await axios.get(
        `/api/social-accounts/auth-url/${platform}`,
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
        // Abrir ventana emergente para autenticación
        const authWindow = window.open(
          response.data.url,
          `${platform}Auth`,
          "width=600,height=700,left=200,top=100"
        );

        if (!authWindow) {
          setIsAuthenticating(false);
          toast.error(
            "El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes para este sitio."
          );
          return false;
        }

        // Verificar si la ventana se cerró manualmente
        const checkWindowClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkWindowClosed);
            setIsAuthenticating(false);
          }
        }, 1000);

        return true;
      } else {
        setIsAuthenticating(false);
        toast.error("No se pudo obtener la URL de autenticación");
        throw new Error("No se pudo obtener la URL de autenticación");
      }
    } catch (error) {
      setIsAuthenticating(false);
      console.error("Error al conectar con la red social:", error);
      toast.error(
        "Error al conectar con la red social: " +
          (error.response?.data?.message || error.message)
      );
      throw error;
    }
  };

  const disconnectSocialMedia = async (platform, accountId) => {
    try {
      setIsAuthenticating(true);

      const response = await axios.delete(`/api/social-accounts/${accountId}`, {
        headers: {
          "X-CSRF-TOKEN": document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content"),
          Accept: "application/json",
        },
        withCredentials: true,
      });

      setIsAuthenticating(false);

      if (response.data.success) {
        toast.success(`Cuenta de ${platform} desconectada exitosamente`);

        // Recargar las cuentas conectadas después de desconectar
        await loadConnectedAccounts();

        return true;
      } else {
        toast.error(
          "Error al desconectar la cuenta: " +
            (response.data.message || "Error desconocido")
        );
        return false;
      }
    } catch (error) {
      setIsAuthenticating(false);
      console.error("Error al desconectar la red social:", error);
      toast.error(
        "Error al desconectar la red social: " +
          (error.response?.data?.message || error.message)
      );
      throw error;
    }
  };

  return {
    accounts,
    isAuthenticating,
    loadConnectedAccounts,
    connectSocialMedia,
    disconnectSocialMedia,
  };
};
