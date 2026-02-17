import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema } from "@/schemas/campaign";

export const useAddCampaignForm = (t: (key: string) => string) => {
  const schema = useMemo(() => campaignSchema(t), [t]);

  // Calculate default dates
  const today = new Date();
  const twoDaysLater = new Date(today);
  twoDaysLater.setDate(today.getDate() + 2);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      budget: "0",
      start_date: formatDate(today),
      end_date: formatDate(twoDaysLater),
      publication_ids: [],
    },
  });

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    errors,
  };
};
