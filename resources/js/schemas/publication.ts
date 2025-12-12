import { z } from "zod";

export const publicationSchema = (t: any) =>
  z.object({
    title: z
      .string()
      .min(1, t("publications.modal.validation.titleRequired"))
      .max(70, t("publications.modal.validation.titleLength")),
    description: z
      .string()
      .min(10, t("publications.modal.validation.descMin"))
      .max(200, t("publications.modal.validation.descMax")),
    goal: z
      .string()
      .min(5, t("publications.modal.validation.objRequired"))
      .max(200, t("publications.modal.validation.objMax")),
    hashtags: z
      .string()
      .min(1, t("publications.modal.validation.hashtagsRequired"))
      .refine((val) => {
        const hashtags = val.split(" ").filter((tag) => tag.startsWith("#"));
        return hashtags.length > 0;
      }, t("publications.modal.validation.hashtagValid"))
      .refine((val) => {
        const hashtags = val.split(" ").filter((tag) => tag.startsWith("#"));
        return hashtags.length <= 10;
      }, t("publications.modal.validation.hashtagMax")),
    scheduled_at: z.string().optional(),
    social_accounts: z.array(z.number()).optional(),
    campaign_id: z.string().optional(),
  });
