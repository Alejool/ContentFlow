import { z } from "zod";
export const campaignSchema = (t: any) => {
  return z.object({
    name: z
      .string()
      .min(1, t("campaigns.modal.validation.nameRequired"))
      .max(100, t("campaigns.modal.validation.nameLength")),
    description: z
      .string()
      .min(1, t("campaigns.modal.validation.descriptionRequired"))
      .max(500, t("campaigns.modal.validation.descriptionLength")),
    goal: z.string().min(1, t("campaigns.modal.validation.goalRequired")),
    budget: z.string().min(1, t("campaigns.modal.validation.budgetRequired")),
    start_date: z
      .string()
      .min(1, t("campaigns.modal.validation.startDateRequired")),
    end_date: z.string().refine((val) => val && val.trim().length > 0, {
      message: t("campaigns.modal.validation.endDateRequired"),
    }),
    publication_ids: z.array(z.number()).optional(),
  });
};
