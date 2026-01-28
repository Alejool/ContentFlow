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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError("");
    setSuccessMessage("");

    try {
      // Get CSRF cookie first
      await axios.get("/sanctum/csrf-cookie");

      // Check if user exists and has a provider
      const checkResponse = await axios.post("/check-user", {
        email: data.email,
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
      console.log("UseAuth: Sending login request...");
      const loginResponse = await axios.post("/login", {
        email: data.email,
        password: data.password,
        remember: data.remember,
      });
      console.log("UseAuth: Login response received", loginResponse);

      if (loginResponse.data.success) {
        setSuccessMessage(t("auth.login.success"));
        window.location.href = loginResponse.data.redirect || "/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Login error:", err);

      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorData = err.response.data.errors;
        Object.keys(errorData).forEach((key) => {
          setError(key as any, errorData[key]);
        });

        const errorMessage = Object.keys(errorData)
          .map((key) => getErrorMessage(errorData[key], t, key))
          .join(" ");

        setGeneralError(errorMessage);
        toast.error(errorMessage);
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

  const handleGoogleLogin = () => {
    console.log("Iniciando redirección a Google...");
    setLoading(true);
    setGeneralError("");
    try {
      const url = route("auth.google.redirect");
      console.log("URL de redirección:", url);
      window.location.href = url;
    } catch (err) {
      console.error("Ziggy route error:", err);
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
    handleGoogleLogin,
    handleFacebookLogin,
  };
};
