import { z } from 'zod';

export const getInviteMemberSchema = (t: (key: string) => string) =>
  z.object({
    email: z.preprocess(
      (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
      z.string().email(t('workspace.invite_modal.validation.email')),
    ),
    role_id: z.number().min(1, t('workspace.invite_modal.validation.role')),
  });

export type InviteMemberFormData = z.infer<ReturnType<typeof getInviteMemberSchema>>;
