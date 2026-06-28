import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCheck } from 'lucide-react';
import React from 'react';
import { formatDateString } from '@/Utils/formatters';
import { useTranslation } from 'react-i18next';

interface SelectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAll: () => void;
  onSelectDay: () => void;
  position: { x: number; y: number };
  dayDate?: Date;
}

/**
 * Menú contextual para opciones de selección
 */
export const SelectionMenu: React.FC<SelectionMenuProps> = ({
  isOpen,
  onClose,
  onSelectAll,
  onSelectDay,
  position,
  dayDate,
}) => {
  const { t } = useTranslation();

  const handleSelectAll = () => {
    onSelectAll();
    onClose();
  };

  const handleSelectDay = () => {
    onSelectDay();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
            }}
            className="z-[101] min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-800"
          >
            {/* Header */}
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Opciones de selección
              </p>
            </div>

            {/* Options */}
            <div className="p-1.5">
              {/* Seleccionar todos */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectAll}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <CheckCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('calendar.selectAll')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Todos los eventos del calendario
                  </p>
                </div>
              </motion.button>

              {/* Seleccionar día */}
              {dayDate && (
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSelectDay}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Seleccionar este día
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateString(dayDate, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SelectionMenu;
