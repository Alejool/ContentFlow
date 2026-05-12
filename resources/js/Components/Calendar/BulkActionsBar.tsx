import { useBulkActions } from '@/Hooks/Calendar/useBulkActions';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { ActionButtons } from './BulkActions/ActionButtons';
import { DeleteModal } from './BulkActions/DeleteModal';
import { MoveModal } from './BulkActions/MoveModal';
import { SelectionInfo } from './BulkActions/SelectionInfo';

interface BulkActionsBarProps {
  selectedCount: number;
  totalEvents: number;
  /** Número de eventos en el día actualmente seleccionado en el sidebar */
  dayEventsCount: number;
  onClearSelection: () => void;
  onBulkMove: (newDate: Date) => Promise<void>;
  onBulkDelete?: (eventIds: string[]) => Promise<void>;
  onUndo?: () => void;
  canUndo?: boolean;
  /** Selecciona todos los eventos visibles */
  onSelectAll: () => void;
  /** Selecciona solo los eventos del día activo */
  onSelectDay: () => void;
  selectedEventIds?: string[];
}

/**
 * Barra flotante de acciones masivas para el calendario.
 * Permite mover, eliminar y seleccionar eventos en bloque.
 */
export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalEvents,
  dayEventsCount,
  onClearSelection,
  onBulkMove,
  onBulkDelete,
  onUndo,
  canUndo = false,
  onSelectAll,
  onSelectDay,
  selectedEventIds = [],
}) => {
  const {
    showMoveModal,
    setShowMoveModal,
    selectedDate,
    setSelectedDate,
    isMoving,
    handleBulkMove,
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    handleBulkDelete,
  } = useBulkActions({
    onBulkMove,
    ...(onBulkDelete ? { onBulkDelete } : {}),
    selectedEventIds,
  });

  if (selectedCount === 0) return null;

  return (
    <>
      {/* ── Floating bar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 transform"
        >
          <motion.div
            initial={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
            animate={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            className="relative rounded-2xl border border-gray-200 bg-white backdrop-blur-xl dark:border-gray-700 dark:bg-gray-800/95"
            style={{ overflow: 'visible' }}
          >
            {/* Top accent gradient */}
            <div className="from-primary-400 via-primary-700 to-primary-900 absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r" />

            <div className="px-6 py-4">
              <div className="flex items-center gap-6">
                <SelectionInfo selectedCount={selectedCount} />

                <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600" />

                <ActionButtons
                  selectedCount={selectedCount}
                  totalEvents={totalEvents}
                  dayEventsCount={dayEventsCount}
                  canUndo={canUndo}
                  onSelectAll={onSelectAll}
                  onSelectDay={onSelectDay}
                  onUndo={onUndo ?? (() => {})}
                  onMove={() => setShowMoveModal(true)}
                  onClearSelection={onClearSelection}
                />
              </div>
            </div>

            {/* Bottom accent */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* ── Move modal ────────────────────────────────────────────────────── */}
      <MoveModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        selectedCount={selectedCount}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onConfirm={handleBulkMove}
        isMoving={isMoving}
      />

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      {onBulkDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          selectedCount={selectedCount}
          onConfirm={handleBulkDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};
