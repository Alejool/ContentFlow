import { getErrorMessage } from "@/Utils/validation";
import { useForm } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const useRegister = () => {
  const { t } = useTranslation();
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { data, setData, errors, setError, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  // Safe wrapper for setting errors which handles different versions of Inertia useForm
  const setFieldErrors = (payload: Record<string, any>) => {
    try {
      // @ts-ignore - handling potential version mismatch safely
      if (typeof setError === "function") {
        Object.keys(payload).forEach((key) => {
          setError(key as any, payload[key]);
        });
      }
    } catch (e) {
      console.warn("Could not set Inertia errors directly", e);
    }
  };

  const submitRegister = async (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    setLoading(true);
    setGeneralError("");
    setSuccessMessage("");

    if (payload.password !== payload.password_confirmation) {
      const msg = t("validation.passwords_do_not_match");
      setGeneralError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "/register",
        {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          password_confirmation: payload.password_confirmation,
        },
        { headers: { Accept: "application/json" } },
      );

      if (response.data?.success) {
        setSuccessMessage(response.data.message);
        toast.success(response.data.message);

        if (response.data.redirect) {
          window.location.href = response.data.redirect;
        }
        reset("name", "email", "password", "password_confirmation");
      }
    } catch (backendError: any) {
      console.error("Registration error:", backendError);

      if (
        backendError.response?.status === 422 &&
        backendError.response?.data?.errors
      ) {
        const errorData = backendError.response.data.errors;
        setFieldErrors(errorData);

        const errorMessage = Object.keys(errorData)
          .map((key) => getErrorMessage(errorData[key], t, key))
          .join(" ");

        setGeneralError(errorMessage);
        toast.error(errorMessage);
        throw errorData;
      } else if (backendError.response?.data?.message) {
        setGeneralError(backendError.response.data.message);
        toast.error(backendError.response.data.message);
      } else {
        const msg = t("common.errors.checkFormErrors");
        setGeneralError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: any) => {
    e.preventDefault();
    await submitRegister({
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
    });
  };

  const handleGoogleRegister = () => {
    setLoading(true);
    setGeneralError("");
    window.location.href = "/auth/google/redirect";
  };

  return {
    data,
    setData,
    error: generalError,
    loading,
    successMessage,
    errors,
    setErrors: setFieldErrors,
    submitRegister,
    handleEmailRegister,
    handleGoogleRegister,
  };
};
