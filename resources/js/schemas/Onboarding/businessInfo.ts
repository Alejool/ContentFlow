import { z } from 'zod';

export const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'nameRequired'),
  businessIndustry: z.string().min(1, 'industryRequired'),
  businessSize: z.string().min(1, 'sizeRequired'),
  businessGoals: z.string().optional(),
});

export type BusinessInfoData = z.infer<typeof businessInfoSchema>;
