import { useForm } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
  [key: string]: any;
}

export const useAuth = () => {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const { data, setData, processing } = useForm<LoginFormData>({
    email: "",
    password: "",
    remember: false,
  });

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Check if user exists and has a provider
      const checkResponse = await axios.post("/check-user", {
        email: data.email,
      });

      const userData = checkResponse.data;

      if (userData.provider) {
        setError(
          `Este usuario se registró con ${userData.provider}. Por favor, inicia sesión con ${userData.provider}.`
        );
        return;
      }

      // Standard Laravel Login
      const loginResponse = await axios.post("/login", {
        email: data.email,
        password: data.password,
        remember: data.remember,
      });

      if (loginResponse.data.success) {
        setSuccessMessage("Login exitoso. Redirecting...");
        window.location.href = loginResponse.data.redirect || "/dashboard";
      } else {
        // Fallback if success is not explicitly true but no error thrown (unlikely with axios)
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Credenciales incorrectas o error en el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError("");

    // Redirect to Laravel Google Auth endpoint
    window.location.href = "/auth/google/redirect";
  };

  const handleFacebookLogin = () => {
    // Placeholder for future Socialite implementation
    setError("Facebook login is currently disabled during migration.");
  };

  return {
    data,
    setData,
    error,
    loading,
    successMessage,
    processing,
    handleEmailLogin,
    handleGoogleLogin,
    handleFacebookLogin,
  };
};
