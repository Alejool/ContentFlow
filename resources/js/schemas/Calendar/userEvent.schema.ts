import { z } from 'zod';

/** Messages are i18n keys — translate at render time with t(). */
export const userEventSchema = z.object({
  title: z.string().min(1, 'calendar.userEvents.modal.validation.titleRequired'),
  description: z.string().optional(),
  start_date: z
    .date({
      required_error: 'calendar.userEvents.modal.validation.startDateRequired',
    })
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'calendar.userEvents.modal.validation.pastDate'),
  end_date: z.date().nullable().optional(),
  remind_at: z.date().nullable().optional(),
  color: z.string().default('#3B82F6'),
  is_public: z.boolean().default(true),
});

export type EventFormValues = z.infer<typeof userEventSchema>;
