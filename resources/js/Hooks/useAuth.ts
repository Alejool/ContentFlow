import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  signInWithFacebook,
  getAuthResult,
  loginAnonymously,
} from "@/firebase";
import axios from "axios";

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
      const response = await axios.post("/check-user", {
        email: data.email,
      });

      const userData = response.data;

      if (userData.provider) {
        setError(
          `Este usuario se registró con ${userData.provider}. Por favor, inicia sesión con ${userData.provider}.`
        );
        return;
      }

      await signInWithEmailAndPassword(auth, data.email, data.password);

      const loginResponse = await axios.post("/login", {
        email: data.email,
        password: data.password,
        firebase_user: {
          email: data.email,
        },
      });

      if (loginResponse.data.success) {
        setSuccessMessage("Login exitoso. Redirecting...");
        window.location.href = loginResponse.data.redirect;
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code) {
        setError("Credenciales incorrectas. Por favor, inténtalo de nuevo.");
      } else {
        setError("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        "Error al iniciar sesión con Google. Por favor, inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithFacebook();
    } catch (err) {
      setError(
        "Error al iniciar sesión con Facebook. Por favor, inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await loginAnonymously();
      setSuccessMessage("Login exitoso. Redirecting...");
    } catch (err) {
      setError(
        "Error al iniciar sesión anónimamente. Por favor, inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
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
    handleAnonymousLogin,
  };
};
