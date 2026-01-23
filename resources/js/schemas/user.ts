import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export const userProfileSchema = (t: any) =>
  z.object({
    name: z
      .string()
      .min(1, t("validation.required"))
      .max(255, t("validation.max.string", { count: 255 })),
    email: z
      .string()
      .email(t("validation.email"))
      .max(255, t("validation.max.string", { count: 255 })),
    phone: z
      .string()
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: t("validation.invalid_phone"),
      })
      .nullable()
      .optional()
      .or(z.literal("")),
    country_code: z.string().optional().or(z.literal("")),
    bio: z
      .string()
      .max(1000, t("validation.max.string", { count: 1000 }))
      .nullable()
      .optional()
      .or(z.literal("")),
    global_platform_settings: z.record(z.any()).optional().nullable(),
  });

export type UserProfileFormData = z.infer<ReturnType<typeof userProfileSchema>>;

export const passwordSchema = (t: any) =>
  z
    .object({
      current_password: z
        .string()
        .min(6, t("validation.min.string", { count: 6 })),
      password: z.string().min(6, t("validation.min.string", { count: 6 })),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("validation.passwords_do_not_match"),
      path: ["password_confirmation"],
    });

export type PasswordFormData = z.infer<ReturnType<typeof passwordSchema>>;

export const deleteUserSchema = (t: any) =>
  z.object({
    password: z.string().min(8, t("validation.min.string", { count: 8 })),
  });

export type DeleteUserFormData = z.infer<ReturnType<typeof deleteUserSchema>>;
