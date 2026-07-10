import { z } from 'zod';

// Only the name is required — matches StoreCampaignRequest, where every other
// field is nullable. Dates are validated for consistency only when both exist.
export const campaignSchema = (t: (key: string, ...args: unknown[]) => string) => {
  return z
    .object({
      name: z
        .string()
        .min(1, t('campaigns.modal.validation.nameRequired'))
        .max(100, t('campaigns.modal.validation.nameLength')),
      description: z
        .string()
        .max(500, t('campaigns.modal.validation.descriptionLength'))
        .optional()
        .or(z.literal('')),
      goal: z.string().optional().or(z.literal('')),
      budget: z.string().optional().or(z.literal('')),
      start_date: z.string().optional().or(z.literal('')),
      end_date: z.string().optional().or(z.literal('')),
      publication_ids: z.array(z.number()).optional(),
    })
    .refine(
      (data) => {
        if (!data.start_date || !data.end_date) return true;
        return new Date(data.end_date) >= new Date(data.start_date);
      },
      {
        message:
          t('campaigns.modal.validation.endDateAfterStart') ||
          'La fecha de fin debe ser posterior a la de inicio',
        path: ['end_date'],
      },
    );
};
