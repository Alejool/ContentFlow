import type { TFunction } from 'i18next';
import { z } from 'zod';

/** i18n-aware factory — messages resolve with the active locale. */
export const createTwoFactorSetupSchema = (t: TFunction) =>
  z.object({
    code: z
      .string()
      .min(6, { message: t('twoFactor.errors.codeMustBe6Digits') })
      .max(6, { message: t('twoFactor.errors.codeMustBe6Digits') })
      .regex(/^\d+$/, { message: t('twoFactor.errors.codeOnlyNumbers') }),
  });

export type TwoFactorSetupFormData = z.infer<ReturnType<typeof createTwoFactorSetupSchema>>;

export const twoFactorVerifySchema = z.object({
  code: z.string().min(1, { message: 'Verification code is required' }),
});

export type TwoFactorVerifyFormData = z.infer<typeof twoFactorVerifySchema>;
