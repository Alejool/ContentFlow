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
    <div className="flex w-full gap-3">
      {/* ── Undo ──────────────────────────────────────────────────────── */}
      {canUndo && onUndo && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute -top-14 right-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            className="whitespace-nowrap rounded-full bg-white shadow-lg dark:bg-gray-800"
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
        className="flex-1"
      >
        <Button
          variant="primary"
          size="md"
          onClick={onMove}
          className="w-full shadow-lg shadow-primary-500/30"
          icon={Calendar}
        >
          {t('calendar.moveEvents') || 'Mover'}
        </Button>
      </motion.div>

      {/* ── Delete ────────────────────────────────────────────────────── */}
      {onDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <Button
            variant="danger"
            size="md"
            onClick={onDelete}
            className="w-full shadow-lg shadow-red-500/30"
            icon={Trash2}
          >
            {t('common.delete') || 'Eliminar'}
          </Button>
        </motion.div>
      )}
    </div>
  );
};
