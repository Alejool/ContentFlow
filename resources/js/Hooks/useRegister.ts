import { useForm } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";

export const useRegister = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { data, setData, errors, reset } = useForm({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleEmailRegister = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    if (data.password !== data.password_confirmation) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Standard Laravel Registration
      const response = await axios.post("/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        toast.success(response.data.message);

        if (response.data.redirect) {
          window.location.href = response.data.redirect;
        }
        reset("name", "email", "password", "password_confirmation");
      }
    } catch (backendError: any) {
      console.error("Registration error:", backendError);

      if (backendError.response?.data?.errors) {
        const errorData = backendError.response.data.errors;
        // Format Laravel validation errors
        const errorMessage = Object.keys(errorData)
          .map((key) => errorData[key].join(" "))
          .join(" ");

        setError(errorMessage);
        toast.error(errorMessage);
      } else if (backendError.response?.data?.message) {
        setError(backendError.response.data.message);
        toast.error(backendError.response.data.message);
      } else {
        setError("An error occurred while creating your account.");
        toast.error("An error occurred while creating your account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setLoading(true);
    setError("");

    // Redirect to Laravel Google Auth endpoint
    window.location.href = "/auth/google/redirect";
  };

  return {
    data,
    setData,
    error,
    loading,
    successMessage,
    errors,
    handleEmailRegister,
    handleGoogleRegister,
  };
};
