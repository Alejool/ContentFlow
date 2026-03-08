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
        .max(700, t("publications.modal.validation.descMax")),
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
            // Check if scheduled date is more than 1 minute (60 seconds) in the future
            const diffInSeconds =
              (scheduledDate.getTime() - now.getTime()) / 1000;
            return diffInSeconds > 60;
          },
          t("publications.modal.validation.scheduledMinDifference") ||
            "La fecha debe ser al menos 1 minuto después de la actual",
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
      // Recurrence
      is_recurring: z.boolean().optional().default(false),
      recurrence_type: z
        .enum(["daily", "weekly", "monthly", "yearly"])
        .optional(),
      recurrence_interval: z.number().min(1).optional().default(1),
      recurrence_days: z.preprocess((val) => {
        if (typeof val === "string") {
          return val
            .split(",")
            .filter((v) => v.trim() !== "")
            .map((v) => parseInt(v));
        }
        if (Array.isArray(val)) {
          return val.map((v) => (typeof v === "string" ? parseInt(v) : v));
        }
        return val;
      }, z.array(z.number()).optional().default([])),
      recurrence_end_date: z.string().optional().nullable(),
      recurrence_accounts: z.array(z.number()).optional().default([]),
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
    )
    .refine(
      (data) => {
        // If it's recurring and type is weekly, ensure at least one day is selected
        if (data.is_recurring && data.recurrence_type === "weekly") {
          return data.recurrence_days && data.recurrence_days.length > 0;
        }
        return true;
      },
      {
        message:
          t("publications.modal.validation.recurrenceDaysRequired") ||
          "Please select at least one day for weekly recurrence",
        path: ["recurrence_days"],
      },
    )
    .refine(
      (data) => {
        // If it's recurring, end date is REQUIRED
        if (data.is_recurring) {
          return !!data.recurrence_end_date;
        }
        return true;
      },
      {
        message:
          t("publications.modal.validation.recurrenceEndDateRequired") ||
          "End date is required for recurring publications",
        path: ["recurrence_end_date"],
      },
    );

export type PublicationFormData = z.infer<ReturnType<typeof publicationSchema>>;
