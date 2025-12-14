import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema } from "@/schemas/campaign";
import { Campaign } from "@/types/Campaign";

export const useEditCampaignForm = (
  t: (key: string) => string,
  campaign: Campaign | null
) => {
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
      name: campaign?.name || campaign?.title || "",
      description: campaign?.description || "",
      goal: campaign?.goal || "",
      budget: campaign?.budget || "",
      start_date: campaign?.start_date || "",
      end_date: campaign?.end_date || "",
      publication_ids: campaign?.publications?.map((p: any) => p.id) || [],
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
