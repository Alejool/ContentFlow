import { getErrorMessage } from "@/Utils/validation";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
  [key: string]: any;
}

export const useAuth = () => {
  const { t } = useTranslation();
  const [generalError, setGeneralError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const { data, setData, processing, errors, setError } =
    useForm<LoginFormData>({
      email: "",
      password: "",
      remember: false,
    });

  const submitLogin = async (payload: LoginFormData) => {
    setLoading(true);
    setGeneralError("");
    setSuccessMessage("");

    try {
      // Get CSRF cookie first
      await axios.get("/sanctum/csrf-cookie");

      // Check if user exists and has a provider
      const checkResponse = await axios.post("/check-user", {
        email: payload.email,
      });

      const userData = checkResponse.data;

      if (userData.provider) {
        const msg = t("auth.login.errors.social_account", {
          provider: userData.provider,
          defaultValue: `Esta cuenta usa ${userData.provider}. Por favor inicia sesión con ese servicio.`,
        });
        setGeneralError(msg);
        toast.error(msg);
        setLoading(false); // Stop loading state
        return;
      }

      // Standard Laravel Login

      const loginResponse = await axios.post("/login", {
        email: payload.email,
        password: payload.password,
        remember: payload.remember,
      });

      if (loginResponse.data.success) {
        setSuccessMessage(t("auth.login.success"));
        window.location.href = loginResponse.data.redirect || "/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorData = err.response.data.errors;
        // If using interactively via handleEmailLogin, update Inertia errors
        Object.keys(errorData).forEach((key) => {
          setError(key as any, errorData[key]);
        });

        const errorMessage = Object.keys(errorData)
          .map((key) => getErrorMessage(errorData[key], t, key))
          .join(" ");

        setGeneralError(errorMessage);
        toast.error(errorMessage);
        // Rethrow for external handling if needed
        throw errorData;
      } else if (err.response?.data?.message) {
        const msg = getErrorMessage(err.response.data.message, t);
        setGeneralError(msg);
        toast.error(msg);
      } else {
        const msg =
          t("validation.auth.failed") ||
          "Credenciales incorrectas o error en el servidor.";
        setGeneralError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin(data);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setGeneralError("");
    try {
      const url = route("auth.google.redirect");

      window.location.href = url;
    } catch (err) {
      // Fallback
      window.location.href = "/auth/google/redirect";
    }
  };

  const handleFacebookLogin = () => {
    setGeneralError("Facebook login is currently disabled during migration.");
    toast.error("Facebook login is currently disabled during migration.");
  };

  return {
    data,
    setData,
    error: generalError,
    loading,
    successMessage,
    processing,
    errors,
    handleEmailLogin,
    submitLogin,
    handleGoogleLogin,
    handleFacebookLogin,
  };
};
