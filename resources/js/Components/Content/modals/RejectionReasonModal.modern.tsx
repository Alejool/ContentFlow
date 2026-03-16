import Button from '@/Components/common/Modern/Button';
import { Popover } from '@/Components/common/Modern/Popover';
import Textarea from '@/Components/common/Modern/Textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

interface RejectionReasonModalProps {
  trigger: ReactNode;
  onSubmit: (reason: string) => void;
  publicationTitle: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface RejectionForm {
  reason: string;
}

/**
 * Modal de razón de rechazo usando React Aria Popover
 *
 * Versión mejorada con:
 * - Mejor accesibilidad
 * - Focus automático en textarea
 * - Validación con Zod
 * - Cierre con ESC
 */
export default function RejectionReasonModalModern({
  trigger,
  onSubmit,
  publicationTitle,
  isOpen,
  onOpenChange,
}: RejectionReasonModalProps) {
  const { t } = useTranslation();

  const rejectionSchema = z.object({
    reason: z
      .string()
      .min(10, t('approvals.validation.reasonMin') || 'La razón debe tener al menos 10 caracteres')
      .max(500, t('approvals.validation.reasonMax') || 'La razón no puede exceder 500 caracteres'),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RejectionForm>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      reason: '',
    },
  });

  const reason = watch('reason', '');

  const onFormSubmit = (data: RejectionForm) => {
    onSubmit(data.reason);
    reset();
    onOpenChange?.(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange?.(false);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Popover trigger={trigger} placement="center" className="w-full max-w-md">
      <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-neutral-700/50">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <AlertCircle className="h-6 w-6 text-red-500" />
          {t('approvals.rejectPublication') || 'Rechazar Publicación'}
        </h2>
        <button
          onClick={handleClose}
          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-neutral-700 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="p-6">
          <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {t('approvals.rejectionReasonDescription') ||
              'Proporciona una razón detallada para el rechazo de'}{' '}
            <span className="font-bold text-gray-900 dark:text-white">"{publicationTitle}"</span>
            {'. '}
            <span className="font-medium text-red-500 dark:text-red-400">
              {t('common.required') || 'Requerido'}
            </span>
          </p>

          <div className="space-y-2">
            <label
              htmlFor="rejection-reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('approvals.rejectionReason') || 'Razón del rechazo'}
            </label>
            <Textarea
              id="rejection-reason"
              {...register('reason')}
              placeholder={
                t('approvals.rejectionReasonPlaceholder') ||
                'Describe por qué esta publicación no cumple con los requisitos...'
              }
              rows={5}
              className={`w-full ${errors.reason ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.reason && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.reason.message}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('common.minCharacters', { count: 10 }) || 'Mínimo 10 caracteres'}</span>
              <span className={reason.length > 500 ? 'text-red-500' : ''}>
                {reason.length} / 500
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 p-6 dark:border-neutral-700/50">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            {t('common.cancel') || 'Cancelar'}
          </Button>
          <Button
            type="submit"
            variant="danger"
            className="flex-1"
            disabled={isSubmitting || !reason.trim()}
            loading={isSubmitting}
          >
            {t('approvals.confirmRejection') || 'Confirmar Rechazo'}
          </Button>
        </div>
      </form>
    </Popover>
  );
}
