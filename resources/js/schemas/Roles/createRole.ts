import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  permissions: z.array(z.number()).default([]),
  approval_participant: z.boolean().default(false),
});

export type CreateRoleFormData = z.infer<typeof createRoleSchema>;
