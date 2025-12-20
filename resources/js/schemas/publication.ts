import { z } from "zod";

export const publicationSchema = (t: any) =>
  z
    .object({
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
          const hashtags = (val || "")
            .split(" ")
            .filter((tag) => tag.startsWith("#"));
          return hashtags.length > 0;
        }, t("publications.modal.validation.hashtagValid"))
        .refine((val) => {
          const hashtags = (val || "")
            .split(" ")
            .filter((tag) => tag.startsWith("#"));
          return hashtags.length <= 10;
        }, t("publications.modal.validation.hashtagMax")),
      scheduled_at: z.string().optional().nullable(),
      social_accounts: z.array(z.number()).optional().default([]),
      status: z.enum(["draft", "published"]).optional().default("draft"),
      campaign_id: z.any().optional().nullable(),
      lock_content: z.boolean().optional(),
    })
    .refine(
      (data) => {
        // If social accounts are selected, a scheduled date is mandatory.
        // Filter out null/undefined IDs to be sure.
        const activeAccounts = (data.social_accounts || []).filter(
          (id) => !!id
        );
        const hasAccounts = activeAccounts.length > 0;

        if (hasAccounts) {
          return !!data.scheduled_at;
        }
        return true;
      },
      {
        message:
          t("publications.modal.validation.scheduledAtRequired") ||
          "Schedule date is required if social accounts are selected",
        path: ["scheduled_at"],
      }
    );

export type PublicationFormData = z.infer<ReturnType<typeof publicationSchema>>;
