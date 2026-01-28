import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema } from "@/schemas/campaign";

export const useAddCampaignForm = (t: (key: string) => string) => {
  const schema = useMemo(() => campaignSchema(t), [t]);

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
      budget: "",
      start_date: "",
      end_date: "",
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
