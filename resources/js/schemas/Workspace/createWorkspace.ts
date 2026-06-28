import type { TFunction } from 'i18next';
import { z } from 'zod';

export const getCreateWorkspaceSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .min(1, t('workspace.invite_modal.validation.nameRequired'))
      .max(255),
    description: z.string().max(1000).optional().or(z.literal('')),
  });

export type CreateWorkspaceFormData = z.infer<ReturnType<typeof getCreateWorkspaceSchema>>;
