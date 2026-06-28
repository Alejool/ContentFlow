import { z } from 'zod';

export const rejectionSchema = z.object({
  reason: z
    .string()
    .min(10, 'approvals.validation.reasonMin')
    .max(500, 'approvals.validation.reasonMax'),
});

export type RejectionFormData = z.infer<typeof rejectionSchema>;
