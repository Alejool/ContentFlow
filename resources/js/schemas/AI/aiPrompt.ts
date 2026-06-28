import { z } from 'zod';

export const getAiPromptSchema = (t: (key: string) => string) =>
  z.object({
    prompt: z
      .string()
      .min(10, t('common.ai.prompt_min'))
      .max(500, t('common.ai.prompt_max')),
  });

export type AiPromptFormData = z.infer<ReturnType<typeof getAiPromptSchema>>;
