import type { TFunction } from 'i18next';
import { z } from 'zod';

/** i18n-aware factory — messages resolve with the active locale. */
export const createLoginSchema = (t: TFunction) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t('validation.required') })
      .email({ message: t('validation.email') }),
    password: z.string().min(1, { message: t('validation.required') }),
    remember: z.boolean().default(false),
  });

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
