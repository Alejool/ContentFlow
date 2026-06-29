import Button from '@/Components/common/Modern/Button';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

/**
 * Modal para eliminar eventos masivamente
 */
export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  isDeleting,
}) => {
  const { t } = useTranslation();

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('calendar.deleteSelectedEvents')}
      size="md"
    >
      <div className="space-y-6">
        {/* Banner de advertencia */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-5 dark:border-red-800 dark:from-red-900/20 dark:to-orange-900/20"
        >
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 transform opacity-10">
            <AlertTriangle className="h-full w-full text-red-600" />
          </div>

          <div className="relative flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 shadow-sm dark:bg-red-900/40"
            >
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </motion.div>
            <div className="flex-1">
              <h4 className="mb-1.5 text-base font-bold text-red-900 dark:text-red-100">
                {t('calendar.confirmDelete')}
              </h4>
              <p className="text-sm leading-relaxed text-red-700 dark:text-red-300">
                {t('calendar.deleteWarning', { count: selectedCount })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-900">
              <span className="text-lg font-bold text-gray-700 dark:text-neutral-300">
                {selectedCount}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedCount === 1
                  ? 'Se eliminará 1 evento'
                  : `Se eliminarán ${selectedCount} eventos`}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
        </motion.div>

        {/* Botones de acción */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-neutral-800"
        >
          <Button variant="ghost" onClick={onClose} disabled={isDeleting} size="md">
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            loading={isDeleting}
            icon={Trash2}
            size="md"
            className="shadow-lg shadow-red-500/30"
          >
            {t('calendar.deleteCount', { count: selectedCount })}
          </Button>
        </motion.div>
      </div>
    </DynamicModal>
  );
};
