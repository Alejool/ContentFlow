import Button from '@/Components/common/Modern/Button';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCheck, CheckSquare, ChevronDown, Undo2, X } from 'lucide-react';
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
  onClearSelection: () => void;
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
  onClearSelection,
}) => {
  const { t } = useTranslation();
  const allSelected = selectedCount === totalEvents && totalEvents > 0;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Calcula la posición del dropdown relativa al botón trigger
  const updatePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8, // 8px de gap sobre el botón
      left: rect.left,
      width: rect.width,
    });
  };

  const handleToggle = () => {
    if (!open) updatePos();
    setOpen((v) => !v);
  };

  // Cierra al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const dropdownEl = document.getElementById('bulk-select-dropdown');
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownEl &&
        !dropdownEl.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Recalcula posición al hacer scroll o resize
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

  return (
    <div className="flex items-center gap-2">
      {/* ── Selector dropdown ───────────────────────────────────────── */}
      {!allSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {/* Trigger */}
          <button
            ref={triggerRef}
            onClick={handleToggle}
            className={`
              inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold
              transition-all duration-150
              ${open
                ? 'border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-600'
              }
            `}
          >
            <CheckCheck className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t('calendar.selectAll')}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown renderizado en portal para evitar clipping */}
          {open &&
            pos &&
            createPortal(
              <AnimatePresence>
                <motion.div
                  id="bulk-select-dropdown"
                  key="bulk-select-dropdown"
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    position: 'fixed',
                    bottom: `calc(100vh - ${pos.top}px)`,
                    left: pos.left,
                    minWidth: 280,
                    zIndex: 99999,
                  }}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                >
                  {/* Header */}
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/60">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {t('calendar.selectOptions') || 'Opciones de selección'}
                    </p>
                  </div>

                  {/* Opción: Seleccionar del día */}
                  <button
                    onClick={() => { onSelectDay(); setOpen(false); }}
                    disabled={dayEventsCount === 0}
                    className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-primary-900/20"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t('calendar.selectDay') || 'Seleccionar del día'}
                        </span>
                        {dayEventsCount > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold text-white">
                            {dayEventsCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {t('calendar.selectDayDescription') || 'Solo eventos del día seleccionado'}
                      </p>
                    </div>
                  </button>

                  <div className="mx-4 h-px bg-gray-100 dark:bg-gray-800" />

                  {/* Opción: Seleccionar todos */}
                  <button
                    onClick={() => { onSelectAll(); setOpen(false); }}
                    className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t('calendar.selectAllEvents') || 'Seleccionar todos'}
                        </span>
                        <span className="inline-flex items-center justify-center rounded-full bg-gray-500 px-2 py-0.5 text-xs font-bold text-white dark:bg-gray-600">
                          {totalEvents}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {t('calendar.selectAllDescription') || 'Todos los eventos visibles en el calendario'}
                      </p>
                    </div>
                  </button>
                </motion.div>
              </AnimatePresence>,
              document.body,
            )}
        </motion.div>
      )}

      {/* ── Undo ──────────────────────────────────────────────────────── */}
      {canUndo && onUndo && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Button
            variant="ghost"
            size="md"
            onClick={onUndo}
            className="whitespace-nowrap"
            title={t('calendar.undoLastOperation')}
            icon={Undo2}
          >
            {t('calendar.undo')}
          </Button>
        </motion.div>
      )}

      {/* ── Move ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          variant="primary"
          size="md"
          onClick={onMove}
          className="shadow-primary-500/30 whitespace-nowrap shadow-lg"
          icon={Calendar}
        >
          {t('calendar.moveEvents')}
        </Button>
      </motion.div>

      {/* ── Clear selection ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Button
          variant="secondary"
          buttonStyle="icon"
          size="md"
          onClick={onClearSelection}
          title={t('calendar.clearSelection')}
          icon={X}
        >
          {null}
        </Button>
      </motion.div>
    </div>
  );
};
