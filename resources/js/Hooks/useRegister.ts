import { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
  signInWithGoogle,
  registerWithEmailAndPassword,
  updateUserProfile,
} from "@/firebase";
import axios from "axios";
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

  const handleEmailRegister = async (e) => {
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
      const userCredential = await registerWithEmailAndPassword(
        data.email,
        data.password
      );
      await updateUserProfile(userCredential.user, {
        displayName: data.name,
      });

      try {
        const response = await axios.post("/register", {
          name: data.name,
          email: data.email,
          password: data.password,
          provider: null,
          provider_id: null,
          photo_url: null,
        });
        console.log(response);

        if (response.data.success) {
          setSuccessMessage(response.data.message);
          toast.success(response.data.message);

          if (response.data.redirect) {
            window.location.href = response.data.redirect;
          }
          reset("name", "email", "password", "password_confirmation");
          reset("password", "password_confirmation");
        }
      } catch (backendError) {
        // Handle Laravel validation errors
        if (backendError.response?.data?.errors) {
          const errorMessage = Object.values(backendError.response.data.errors)
            .flat()
            .join(" ");
          setError(
            (prevError) => `${prevError ? prevError + ". " : ""}${errorMessage}`
          );
          toast.error(errorMessage);
        }

        // Handle general backend error message
        if (backendError.response?.data?.message) {
          setError(
            (prevError) =>
              `${prevError ? prevError + ". " : ""}${
                backendError.response.data.message
              }`
          );
          toast.error(backendError.response.data.message);
        }

        if (!backendError.response?.data) {
          setError(
            (prevError) =>
              `${
                prevError ? prevError + ". " : ""
              }An error occurred while saving user data.`
          );
          toast.error("An error occurred while saving user data.");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      const firebaseError =
        getFirebaseErrorMessage(err.code) ||
        "Error creating account. Please try again.";
      toast.error(firebaseError);
      setError(
        (prevError) => `${prevError ? prevError + ". " : ""}${firebaseError}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await signInWithGoogle();
      const user = result.user;

      try {
        await axios.post("/register", {
          name: user.displayName,
          email: user.email,
          provider: "google",
          provider_id: user.uid,
          photo_url: user.photoURL,
        });
      } catch (backendError) {
        console.error(
          "Backend save failed but Google sign-in succeeded:",
          backendError
        );
      }

      setSuccessMessage("Signed in with Google successfully! Redirecting...");

      setTimeout(() => {
        window.location.href = route("dashboard");
      }, 1500);
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(
        getFirebaseErrorMessage(err.code) ||
          "Error signing in with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "Email address is already in use.";
      case "auth/invalid-email":
        return "Email address is invalid.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Account creation is currently disabled.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was canceled. Please try again.";
      default:
        return null;
    }
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
