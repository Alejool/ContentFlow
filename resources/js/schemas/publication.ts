import { z } from 'zod';

// Define validation rules by content type
const VALIDATION_RULES = {
  post: {
    requiresTitle: true,
    requiresDescription: true,
    requiresGoal: true,
    requiresHashtags: true,
    descriptionMinLength: 1,
    descriptionMaxLength: 700,
  },
  reel: {
    requiresTitle: true,
    requiresDescription: true,
    requiresGoal: false,
    requiresHashtags: true,
    descriptionMinLength: 1,
    descriptionMaxLength: 300,
  },
  story: {
    requiresTitle: false,
    requiresDescription: false,
    requiresGoal: false,
    requiresHashtags: false,
    descriptionMinLength: 0,
    descriptionMaxLength: 150,
  },
  poll: {
    requiresTitle: true,
    requiresDescription: false,
    requiresGoal: false,
    requiresHashtags: false,
    descriptionMinLength: 0,
    descriptionMaxLength: 280,
  },
  carousel: {
    requiresTitle: true,
    requiresDescription: true,
    requiresGoal: true,
    requiresHashtags: true,
    descriptionMinLength: 1,
    descriptionMaxLength: 500,
  },
};

export const publicationSchema = (t: (key: string, ...args: unknown[]) => string, contentType: string = 'post') => {
  const rules =
    VALIDATION_RULES[contentType as keyof typeof VALIDATION_RULES] || VALIDATION_RULES.post;

  console.log('Creating schema for content type:', contentType, 'with rules:', rules);

  return z
    .object({
      title: rules.requiresTitle
        ? z
            .string()
            .min(
              1,
              contentType === 'poll'
                ? t('publications.modal.validation.questionRequired') || 'Question is required'
                : t('publications.modal.validation.titleRequired'),
            )
            .max(70, t('publications.modal.validation.titleLength'))
        : z
            .string()
            .max(70, t('publications.modal.validation.titleLength'))
            .optional()
            .or(z.literal('')),

      description: rules.requiresDescription
        ? z
            .string()
            .min(rules.descriptionMinLength, t('publications.modal.validation.descMin'))
            .max(rules.descriptionMaxLength, t('publications.modal.validation.descMax'))
        : z
            .string()
            .max(rules.descriptionMaxLength, t('publications.modal.validation.descMax'))
            .optional()
            .or(z.literal('')),

      goal: rules.requiresGoal
        ? z
            .string()
            .min(5, t('publications.modal.validation.objRequired'))
            .max(200, t('publications.modal.validation.objMax'))
        : z
            .string()
            .max(200, t('publications.modal.validation.objMax'))
            .optional()
            .or(z.literal('')),

      hashtags: z
        .union([z.string(), z.array(z.string())])
        .transform((val) => {
          // Convert array to string if needed
          if (Array.isArray(val)) {
            return val.join(' ');
          }
          return val || '';
        })
        .default(''),
      scheduled_at: z
        .string()
        .optional()
        .nullable()
        .refine(
          (val) => {
            // If no value provided, it's valid (optional field)
            if (!val || val === '' || val === null || val === undefined) return true;

            try {
              const scheduledDate = new Date(val);
              const now = new Date();

              // Check if the date is valid
              if (isNaN(scheduledDate.getTime())) {
                return false;
              }

              // Check if scheduled date is more than 1 minute (60 seconds) in the future
              const diffInSeconds = (scheduledDate.getTime() - now.getTime()) / 1000;
              return diffInSeconds > 60;
            } catch {
              // If there's any error parsing the date, consider it invalid
              return false;
            }
          },
          {
            message:
              t('publications.modal.validation.scheduledMinDifference') ||
              'La fecha debe ser al menos 1 minuto después de la actual',
            path: ['scheduled_at'],
          },
        ),
      social_accounts: z.array(z.number()).optional().default([]),
      status: z
        .enum([
          'draft',
          'published',
          'scheduled',
          'publishing',
          'failed',
          'pending_review',
          'approved',
          'rejected',
        ])
        .optional()
        .default('draft'),
      campaign_id: z.any().optional().nullable(),
      lock_content: z.boolean().optional(),
      use_global_schedule: z.boolean().optional().default(false),
      // Content type
      content_type: z
        .enum(['post', 'reel', 'story', 'poll', 'carousel'])
        .optional()
        .default('post'),
      // Poll fields
      poll_options: z.array(z.string()).optional().nullable(),
      poll_duration_hours: z.number().min(1).max(168).optional().nullable(),
      // Carousel fields
      carousel_items: z.array(z.any()).optional().nullable(),
      // Content metadata
      content_metadata: z.any().optional().nullable(),
      // Recurrence
      is_recurring: z.boolean().optional().default(false),
      recurrence_type: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
      recurrence_interval: z.number().min(1).optional().default(1),
      recurrence_days: z.preprocess((val) => {
        if (typeof val === 'string') {
          return val
            .split(',')
            .filter((v) => v.trim() !== '')
            .map((v) => parseInt(v));
        }
        if (Array.isArray(val)) {
          return val.map((v) => (typeof v === 'string' ? parseInt(v) : v));
        }
        return val;
      }, z.array(z.number()).optional().default([])),
      recurrence_end_date: z.string().optional().nullable(),
      recurrence_accounts: z.array(z.number()).optional().default([]),
    })
    .refine(
      (data) => {
        // Special handling for polls - they don't require scheduling validation
        // if use_global_schedule is false
        if (data.content_type === 'poll' && !data.use_global_schedule) {
          return true; // Skip scheduled_at validation for polls without global schedule
        }

        // If "use_global_schedule" is checked, we require a valid date.
        if (data.use_global_schedule) {
          if (!data.scheduled_at || data.scheduled_at === '' || data.scheduled_at === null) {
            return false;
          }

          try {
            const scheduledDate = new Date(data.scheduled_at);
            const now = new Date();

            // Check if the date is valid
            if (isNaN(scheduledDate.getTime())) {
              return false;
            }

            // For polls, be more lenient with the time requirement
            if (data.content_type === 'poll') {
              // Allow polls to be scheduled with less strict time requirements
              const diffInSeconds = (scheduledDate.getTime() - now.getTime()) / 1000;
              return diffInSeconds > 0; // Just needs to be in the future
            }

            // For other content types, require 1 minute in the future
            const diffInSeconds = (scheduledDate.getTime() - now.getTime()) / 1000;
            return diffInSeconds > 60;
          } catch {
            return false;
          }
        }
        return true;
      },
      {
        message:
          t('publications.modal.validation.scheduledAtRequired') ||
          'Schedule date is required if global schedule is enabled',
        path: ['scheduled_at'],
      },
    )
    .refine(
      (data) => {
        // If it's recurring and type is weekly, ensure at least one day is selected
        if (data.is_recurring && data.recurrence_type === 'weekly') {
          return data.recurrence_days && data.recurrence_days.length > 0;
        }
        return true;
      },
      {
        message:
          t('publications.modal.validation.recurrenceDaysRequired') ||
          'Please select at least one day for weekly recurrence',
        path: ['recurrence_days'],
      },
    )
    .refine(
      (data) => {
        // If it's recurring, end date is REQUIRED
        if (data.is_recurring) {
          return !!data.recurrence_end_date;
        }
        return true;
      },
      {
        message:
          t('publications.modal.validation.recurrenceEndDateRequired') ||
          'End date is required for recurring publications',
        path: ['recurrence_end_date'],
      },
    )
    .refine(
      (data) => {
        // If content type is poll, poll_options are required
        if (data.content_type === 'poll') {
          console.log('Poll validation - poll_options:', data.poll_options);
          console.log('Poll validation - poll_duration_hours:', data.poll_duration_hours);

          // Check if poll_options exist and are valid
          if (!data.poll_options || !Array.isArray(data.poll_options)) {
            console.log('Poll options missing or not array');
            return false;
          }

          const hasValidOptions =
            data.poll_options.length >= 2 &&
            data.poll_options.length <= 4 &&
            data.poll_options.every((opt) => opt && opt.trim().length > 0);

          console.log('Poll options valid:', hasValidOptions);
          return hasValidOptions;
        }
        return true;
      },
      {
        message:
          t('publications.modal.validation.pollOptionsRequired') ||
          'Poll requires 2-4 non-empty options',
        path: ['poll_options'],
      },
    )
    .refine(
      (data) => {
        // If content type is poll, duration is required
        if (data.content_type === 'poll') {
          // Check if poll_duration_hours exists and is valid
          if (!data.poll_duration_hours || typeof data.poll_duration_hours !== 'number') {
            console.log('Poll duration missing or not number');
            return false;
          }

          const hasValidDuration = data.poll_duration_hours >= 1 && data.poll_duration_hours <= 168;

          console.log('Poll duration valid:', hasValidDuration);
          return hasValidDuration;
        }
        return true;
      },
      {
        message:
          t('publications.modal.validation.pollDurationRequired') ||
          'Poll duration must be between 1 and 168 hours',
        path: ['poll_duration_hours'],
      },
    )
    .refine(
      (data) => {
        const currentRules =
          VALIDATION_RULES[data.content_type as keyof typeof VALIDATION_RULES] ||
          VALIDATION_RULES.post;

        console.log(
          'Hashtags validation for',
          data.content_type,
          '- requires hashtags:',
          currentRules.requiresHashtags,
        );
        console.log('Hashtags value:', data.hashtags, 'Type:', typeof data.hashtags);

        // If hashtags are not required for this content type, skip validation
        if (!currentRules.requiresHashtags) {
          console.log('Skipping hashtags validation for', data.content_type);
          return true;
        }

        // For content types that require hashtags
        const hashtags = String(data.hashtags || '');

        if (hashtags.trim().length === 0) {
          console.log('Hashtags validation failed: empty');
          return false;
        }

        // Simple validation: just check if there's at least one # character
        const hasHashtag = hashtags.includes('#');
        console.log('Hashtags validation result:', hasHashtag);
        return hasHashtag;
      },
      {
        message: t('publications.modal.validation.hashtagsRequired'),
        path: ['hashtags'],
      },
    )
    .refine(
      (data) => {
        const currentRules =
          VALIDATION_RULES[data.content_type as keyof typeof VALIDATION_RULES] ||
          VALIDATION_RULES.post;

        // If hashtags are not required for this content type, skip count validation
        if (!currentRules.requiresHashtags) {
          return true;
        }

        // For content types that require hashtags, validate count
        const hashtags = String(data.hashtags || '');

        if (hashtags.trim().length > 0) {
          const hashtagArray = hashtags
            .split(/[\s,]+/) // Split by spaces or commas
            .map((tag) => tag.trim())
            .filter((tag) => tag.startsWith('#') && tag.length > 1);
          return hashtagArray.length <= 10;
        }
        return true;
      },
      {
        message: t('publications.modal.validation.hashtagMax'),
        path: ['hashtags'],
      },
    );
};

export type PublicationFormData = z.infer<ReturnType<typeof publicationSchema>>;
