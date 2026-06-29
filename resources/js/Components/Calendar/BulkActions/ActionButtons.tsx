import Button from '@/Components/common/Modern/Button';
import { cn } from '@/lib/common/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCheck, CheckSquare, Trash2, Undo2 } from 'lucide-react';
import { useMousedownOutside } from '@/Hooks/common/useMousedownOutside';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface ActionButtonsProps {
  selectedCount: number;
  totalEvents: number;
  dayEventsCount: number;
  canUndo?: boolean;
  onSelectAll: () => void;
  onSelectDay: () => void;
  onUndo?: () => void;
  onMove: () => void;
  onDelete?: () => void;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

/**
 * Botones de acción de la barra de selección masiva.
 * El dropdown se renderiza en un portal para evitar problemas de z-index / overflow.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  selectedCount,
  totalEvents,
  dayEventsCount,
  canUndo = false,
  onSelectAll,
  onSelectDay,
  onUndo,
  onMove,
  onDelete,
}) => {
  const { t } = useTranslation();
  const allSelected = selectedCount === totalEvents && totalEvents > 0;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8,
      left: rect.left,
      width: rect.width,
    });
  };

  const handleToggle = () => {
    if (!open) updatePos();
    setOpen((v) => !v);
  };

  useMousedownOutside(open, () => setOpen(false), {
    triggerRef,
    boundaries: ['bulk-select-dropdown'],
  });

  useEffect(() => {
    if (!open) return;
    const handler = () => updatePos();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open]);

  const mainActionColumns = onDelete ? 3 : 2;

  return (
    <div
      className={cn(
        'grid w-full flex-1 gap-2',
        mainActionColumns === 2 ? 'grid-cols-2' : 'grid-cols-3',
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-w-0"
      >
        <Button
          ref={triggerRef}
          variant="ghost"
          buttonStyle="ghost"
          size="md"
          onClick={handleToggle}
          className={cn(
            'w-full min-w-0 gap-2 px-3 [&>span]:min-w-0 [&>span]:truncate',
            allSelected && 'bg-primary-50 text-primary-600 dark:bg-primary-900/20',
          )}
          icon={allSelected ? CheckCheck : CheckSquare}
        >
          {allSelected
            ? t('calendar.allSelected') || 'Todos'
            : t('calendar.select') || 'Seleccionar'}
        </Button>

        {open &&
          pos &&
          createPortal(
            <AnimatePresence>
              <motion.div
                id="bulk-select-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                style={{
                  position: 'fixed',
                  bottom: `calc(100vh - ${pos.top}px)`,
                  left: pos.left,
                  minWidth: 280,
                  zIndex: 99999,
                }}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-800"
              >
                {/* Header */}
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase dark:text-neutral-500">
                    {t('calendar.selectOptions') || 'Opciones de selección'}
                  </p>
                </div>

                {/* Opción: Seleccionar del día */}
                <button
                  onClick={() => {
                    onSelectDay();
                    setOpen(false);
                  }}
                  disabled={dayEventsCount === 0}
                  className="group hover:bg-primary-50 dark:hover:bg-primary-900/20 flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="bg-primary-100 text-primary-600 group-hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-400 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t('calendar.selectDay') || 'Seleccionar del día'}
                      </span>
                      {dayEventsCount > 0 && (
                        <span className="bg-primary-500 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold text-white">
                          {dayEventsCount}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
                      {t('calendar.selectDayDescription') || 'Solo eventos del día seleccionado'}
                    </p>
                  </div>
                </button>

                <div className="mx-4 h-px bg-gray-100 dark:bg-neutral-800" />

                {/* Opción: Seleccionar todos */}
                <button
                  onClick={() => {
                    onSelectAll();
                    setOpen(false);
                  }}
                  className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-900/50"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-gray-200 dark:bg-neutral-900 dark:text-neutral-400 dark:group-hover:bg-neutral-800">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t('calendar.selectAllEvents') || 'Seleccionar todos'}
                      </span>
                      <span className="inline-flex items-center justify-center rounded-full bg-gray-500 px-2 py-0.5 text-xs font-bold text-white dark:bg-neutral-600">
                        {totalEvents}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
                      {t('calendar.selectAllDescription') ||
                        'Todos los eventos visibles en el calendario'}
                    </p>
                  </div>
                </button>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
      </motion.div>

      {canUndo && onUndo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-14 right-0"
        >
          <Button
            variant="ghost"
            size="md"
            onClick={onUndo}
            className="rounded-full bg-white whitespace-nowrap shadow-lg dark:bg-neutral-800"
            title={t('calendar.undoLastOperation')}
            icon={Undo2}
          >
            {t('calendar.undo')}
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="min-w-0"
      >
        <Button
          variant="primary"
          size="md"
          onClick={onMove}
          className="shadow-primary-500/30 w-full min-w-0 shadow-lg [&>span]:min-w-0 [&>span]:truncate"
          icon={Calendar}
        >
          {t('calendar.moveEvents') || 'Mover'}
        </Button>
      </motion.div>

      {onDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="min-w-0"
        >
          <Button
            variant="danger"
            size="md"
            onClick={onDelete}
            className="w-full min-w-0 shadow-lg shadow-red-500/30 [&>span]:min-w-0 [&>span]:truncate"
            icon={Trash2}
          >
            {t('common.delete') || 'Eliminar'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};
