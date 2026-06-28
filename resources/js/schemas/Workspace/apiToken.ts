import { z } from 'zod';

export const createApiTokenSchema = z.object({
  name: z
    .string()
    .min(2, 'validation.api_token_name_min')
    .max(255, 'validation.api_token_name_max')
    .regex(/^[a-zA-Z0-9 _\-\.]+$/, 'validation.api_token_name_chars'),
  abilities: z.array(z.string()).default([]),
});

export type CreateApiTokenData = z.infer<typeof createApiTokenSchema>;
