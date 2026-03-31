import { Popover } from '@/Components/common/Modern/Popover';
import { AlertTriangle, X } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface ConfirmDialogProps {
  trigger: ReactNode;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

/**
 * ConfirmDialog usando React Aria Popover
 *
 * Versión mejorada del diálogo de confirmación con:
 * - Mejor accesibilidad
 * - Posicionamiento automático
 * - Cierre con ESC
 * - Menos código
 */
export default function ConfirmDialogModern({
  trigger,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Popover trigger={trigger} placement="center" className="w-full max-w-md">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`h-12 w-12 flex-shrink-0 rounded-full ${styles.iconBg} flex items-center justify-center`}
          >
            <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
          </div>

          <div className="flex-1">
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="flex-shrink-0 rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
            aria-label="Cerrar diálogo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors ${styles.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Popover>
  );
}

/**
 * Hook para usar ConfirmDialog de forma imperativa
 *
 * @example
 * const confirm = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: '¿Eliminar publicación?',
 *     message: 'Esta acción no se puede deshacer',
 *     type: 'danger'
 *   });
 *
 *   if (confirmed) {
 *     // Proceder con eliminación
 *   }
 * };
 */
export function useConfirmDialog() {
  // TODO: Implementar versión imperativa con context/portal
  // Por ahora, usar la versión declarativa con trigger
  return null;
}
