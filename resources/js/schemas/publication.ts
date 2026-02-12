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
      scheduled_at: z
        .string()
        .optional()
        .nullable()
        .refine(
          (val) => {
            if (!val) return true;
            const scheduledDate = new Date(val);
            const now = new Date();
            // Requiere al menos 5 minutos en el futuro
            return scheduledDate.getTime() >= now.getTime() + 300000;
          },
          t("publications.modal.validation.scheduledMinDifference") ||
            "La fecha debe ser al menos 5 minutos después de la actual",
        ),
      social_accounts: z.array(z.number()).optional().default([]),
      status: z
        .enum([
          "draft",
          "published",
          "scheduled",
          "publishing",
          "failed",
          "pending_review",
          "approved",
          "rejected",
        ])
        .optional()
        .default("draft"),
      campaign_id: z.any().optional().nullable(),
      lock_content: z.boolean().optional(),
      use_global_schedule: z.boolean().optional().default(false),
    })
    .refine(
      (data) => {
        // If "use_global_schedule" is checked, we require a date.
        if (data.use_global_schedule) {
          return !!data.scheduled_at;
        }
        return true;
      },
      {
        message:
          t("publications.modal.validation.scheduledAtRequired") ||
          "Schedule date is required if global schedule is enabled",
        path: ["scheduled_at"],
      },
    );

export type PublicationFormData = z.infer<ReturnType<typeof publicationSchema>>;
