import Button from '@/Components/common/Modern/Button';
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { formatSelectedDate, normalizeToStartOfDay } from '@/Utils/Calendar/bulkActionsHelpers';
import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onConfirm: () => Promise<void>;
  isMoving: boolean;
}

/**
 * Modal para mover eventos masivamente
 */
export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  selectedDate,
  onDateChange,
  onConfirm,
  isMoving,
}) => {
  const { t } = useTranslation();

  const handleDateChange = (date: Date | null) => {
    if (date) {
      onDateChange(normalizeToStartOfDay(date));
    }
  };

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('calendar.moveSelectedEvents')}
      size="md"
    >
      <div className="space-y-6">
        {/* Banner informativo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-primary-200 from-primary-50 dark:border-primary-800 dark:from-primary-900/20 relative overflow-hidden rounded-lg border bg-gradient-to-br to-blue-50 p-5 dark:to-blue-900/20"
        >
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 transform opacity-10">
            <Sparkles className="text-primary-600 h-full w-full" />
          </div>

          <div className="relative flex items-start gap-4">
            <div className="bg-primary-100 dark:bg-primary-900/40 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm">
              <Calendar className="text-primary-600 dark:text-primary-400 h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-primary-900 dark:text-primary-100 mb-1.5 text-base font-bold">
                {t('calendar.movingEvents', { count: selectedCount })}
              </h4>
              <p className="text-primary-700 dark:text-primary-300 text-sm leading-relaxed">
                {t('calendar.selectNewDateTime')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Selector de fecha */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <DatePickerModern
            label={t('calendar.newDateAndTime')}
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={new Date()}
            allowPastDates={false}
            isClearable={false}
            showTimeSelect={false}
            variant="outlined"
            size="lg"
          />

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
            <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-neutral-400">
              {t('calendar.selected_date')}
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {formatSelectedDate(selectedDate)}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
              <div className="h-1 w-1 rounded-full bg-gray-400" />
              <span>{t('calendar.preserveOriginalTime')}</span>
              <div className="h-1 w-1 rounded-full bg-gray-400" />
            </div>
          </div>
        </motion.div>

        {/* Botones de acción */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-neutral-800"
        >
          <Button
            variant="ghost"
            buttonStyle="ghost"
            onClick={onClose}
            disabled={isMoving}
            size="lg"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isMoving}
            loading={isMoving}
            icon={Calendar}
            size="lg"
            className="shadow-primary-500/30 shadow-lg"
          >
            {t('calendar.moveCount', { count: selectedCount })}
          </Button>
        </motion.div>
      </div>
    </DynamicModal>
  );
};
