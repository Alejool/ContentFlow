import { userEventService } from '@/Services/Calendar/userEventService';
import { userEventSchema, type EventFormValues } from '@/schemas/Calendar/userEvent.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePage } from '@inertiajs/react';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export type { EventFormValues };

interface UseUserEventFormProps {
  show: boolean;
  event?: any;
  selectedDate?: Date;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Hook for managing user event form state and logic
 */
export function useUserEventForm({
  show,
  event,
  selectedDate,
  onSuccess,
  onClose,
}: UseUserEventFormProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const currentUser = auth.user;
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const form = useForm<EventFormValues>({
    resolver: zodResolver(userEventSchema),
    defaultValues: {
      title: '',
      description: '',
      color: '#3B82F6',
      start_date: new Date(),
      is_public: true,
    },
  });

  const { reset, handleSubmit, setValue, watch } = form;

  // Watch color changes
  const colorValue = watch('color');
  useEffect(() => {
    if (colorValue) {
      setSelectedColor(colorValue);
    }
  }, [colorValue]);

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (show) {
      if (event) {
        const eventColor = event.backgroundColor || event.color || '#3B82F6';
        reset({
          title: event.title || '',
          description: event?.extendedProps?.description || '',
          start_date: event.start
            ? typeof event.start === 'string'
              ? parseISO(event.start)
              : event.start
            : new Date(),
          end_date: event.end
            ? typeof event.end === 'string'
              ? parseISO(event.end)
              : event.end
            : null,
          color: eventColor,
          remind_at: event.extendedProps?.remind_at
            ? typeof event.extendedProps.remind_at === 'string'
              ? parseISO(event.extendedProps.remind_at)
              : event.extendedProps.remind_at
            : null,
          is_public: event.extendedProps?.is_public ?? true,
        });
        setSelectedColor(eventColor);
      } else if (selectedDate) {
        reset({
          title: '',
          description: '',
          start_date: selectedDate,
          end_date: null,
          color: '#3B82F6',
          remind_at: null,
          is_public: true,
        });
        setSelectedColor('#3B82F6');
      } else {
        reset({
          title: '',
          description: '',
          start_date: new Date(),
          end_date: null,
          color: '#3B82F6',
          remind_at: null,
          is_public: true,
        });
        setSelectedColor('#3B82F6');
      }
    }
  }, [event, selectedDate, show, reset]);

  // Check permissions
  const isOwner =
    !event ||
    (event.user?.id && Number(event.user.id) === Number(currentUser?.id)) ||
    (!event.user?.id && event.extendedProps?.user_name === currentUser?.name);

  const isPast = isBefore(startOfDay(watch('start_date') || new Date()), startOfDay(new Date()));
  const isReadOnly = !isOwner || (isPast && !event);

  // Submit handler
  const onSubmit = async (data: EventFormValues) => {
    try {
      const payload = {
        ...data,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        remind_at: data.remind_at ? new Date(data.remind_at).toISOString() : null,
      };

      if (event) {
        const resourceId = event.id.includes('_') ? event.id.split('_')[2] : event.id;
        await userEventService.update(resourceId, payload);
        toast.success(t('calendar.userEvents.modal.messages.successUpdate'));
      } else {
        await userEventService.create(payload);
        toast.success(t('calendar.userEvents.modal.messages.successCreate'));
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      // Handle validation errors from Laravel
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        
        // Set form errors for each field
        Object.keys(backendErrors).forEach((field) => {
          const messages = backendErrors[field];
          if (Array.isArray(messages) && messages.length > 0) {
            const errorMessage = messages[0];
            
            // Try to extract validation rule from Laravel error message
            // Laravel format: "The field_name field must be..."
            let translatedMessage = errorMessage;
            
            // Check if it's a date validation error
            if (errorMessage.includes('must be a date after')) {
              translatedMessage = t('validation.after', { 
                attribute: t(`calendar.userEvents.modal.fields.${field.replace('_', '')}`),
                date: 'ahora',
                defaultValue: 'La fecha debe ser posterior a ahora'
              });
            } else if (errorMessage.includes('must be a date after or equal')) {
              translatedMessage = t('validation.after_or_equal', { 
                attribute: t(`calendar.userEvents.modal.fields.${field.replace('_', '')}`),
                date: 'la fecha de inicio',
                defaultValue: 'La fecha debe ser posterior o igual a la fecha de inicio'
              });
            } else if (errorMessage.includes('must be a date before')) {
              translatedMessage = t('validation.before', { 
                attribute: t(`calendar.userEvents.modal.fields.${field.replace('_', '')}`),
                date: 'ahora',
                defaultValue: 'La fecha debe ser anterior a ahora'
              });
            } else if (errorMessage.includes('is required')) {
              translatedMessage = t('validation.required', {
                defaultValue: 'Este campo es obligatorio'
              });
            } else {
              // Try to translate the full message or use as-is
              translatedMessage = t(`validation.${errorMessage}`, { 
                defaultValue: errorMessage 
              });
            }
            
            form.setError(field as any, {
              type: 'manual',
              message: translatedMessage,
            });
          }
        });

        // Show a general error toast
        toast.error(t('calendar.userEvents.modal.messages.validationError'));
      } else {
        // Handle other errors
        toast.error(
          error.response?.data?.message || t('calendar.userEvents.modal.messages.errorSave'),
        );
      }
    }
  };

  // Get creator info
  const getCreatorInfo = () => {
    if (!event?.user?.id && !event?.extendedProps?.user_name) {
      return '';
    }

    const isCurrentUser =
      (event.user?.id && Number(event.user.id) === Number(currentUser?.id)) ||
      (!event.user?.id && event.extendedProps?.user_name === currentUser?.name);

    const creatorName = isCurrentUser
      ? t('common.me') || 'Yo'
      : event.user?.name || event.extendedProps?.user_name;

    return ` • ${t('common.creator')}: ${creatorName}`;
  };

  return {
    form,
    selectedColor,
    setSelectedColor,
    isOwner,
    isReadOnly,
    currentUser,
    onSubmit: handleSubmit(onSubmit),
    getCreatorInfo,
    setValue,
    watch,
  };
}
