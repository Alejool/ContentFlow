import { z } from "zod";

export const userProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name cannot exceed 255 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email cannot exceed 255 characters"),
  country_code: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\d*$/, "Phone must contain only digits")
    .max(10, "Phone number cannot exceed 10 digits")
    .nullable()
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(1000, "Bio cannot exceed 1000 characters")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

export const passwordSchema = z
  .object({
    current_password: z
      .string()
      .min(6, "Current password must be at least 6 characters"),
    password: z.string().min(6, "New password must be at least 6 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export type PasswordFormData = z.infer<typeof passwordSchema>;

export const deleteUserSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type DeleteUserFormData = z.infer<typeof deleteUserSchema>;
