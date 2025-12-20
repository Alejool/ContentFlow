import { z } from "zod";

export const facebookSettingsSchema = z.object({
  type: z.enum(["feed", "reel"], {
    required_error: "manageContent.validation.facebook.typeRequired",
    invalid_type_error: "manageContent.validation.facebook.typeInvalid",
  }),
});

export const instagramSettingsSchema = z.object({
  type: z.enum(["post", "reel", "story"], {
    required_error: "manageContent.validation.instagram.typeRequired",
    invalid_type_error: "manageContent.validation.instagram.typeInvalid",
  }),
});

export const twitterSettingsSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: z.enum(["tweet", "thread"]),
    }),
    z.object({
      type: z.literal("poll"),
      poll_options: z
        .array(z.string())
        .min(2, "manageContent.validation.twitter.pollOptionsMin")
        .refine((options) => options.every((opt) => opt.trim().length > 0), {
          message: "manageContent.validation.twitter.pollOptionEmpty",
        }),
      poll_duration: z.number().min(5).max(10080),
    }),
  ],
  {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_union_discriminator) {
        return { message: "manageContent.validation.twitter.typeRequired" };
      }
      return { message: ctx.defaultError };
    },
  }
);

export const tiktokSettingsSchema = z.object({
  type: z
    .enum(["post", "video"], {
      // Assuming structure based on generic patterns
      required_error: "manageContent.validation.tiktok.typeRequired",
      invalid_type_error: "manageContent.validation.tiktok.typeInvalid",
    })
    .optional(), // TikTok might simpler, making it optional for now until verified
  privacy: z.enum(["public", "friends", "private"]).optional(),
});

export const youtubeSettingsSchema = z.object({
  type: z.enum(["video", "short"], {
    required_error: "manageContent.validation.youtube.typeRequired",
    invalid_type_error: "manageContent.validation.youtube.typeInvalid",
  }),
  privacy: z.enum(["public", "unlisted", "private"]).optional(),
});

export const getPlatformSchema = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "facebook":
      return facebookSettingsSchema;
    case "instagram":
      return instagramSettingsSchema;
    case "twitter":
    case "x":
      return twitterSettingsSchema;
    case "tiktok":
      return tiktokSettingsSchema;
    case "youtube":
      return youtubeSettingsSchema;
    default:
      return z.any();
  }
};
