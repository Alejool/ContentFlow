import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePage } from "@inertiajs/react";
import axios from "axios";

export const useUpdate = (schema) => {
  const user = usePage().props.auth.user;

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const watchedValues = {
    name: watch("name"),
    email: watch("email"),
  };

  const submitHandler = async (data) => {
    try {
      const response = await axios.patch(route("profile.update"), data);
      return response.data;
    } catch (error) {
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          setError(key, { message: value[0] });
        });
      }
      throw error;
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(submitHandler),
    errors,
    isSubmitting,
    watchedValues,
  };
};
