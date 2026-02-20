import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import { Calendar, X, Undo2, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { DateTimePicker } from "./DateTimePicker";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkMove: (newDate: Date) => Promise<void>;
  onBulkDelete?: (eventIds: string[]) => Promise<void>;
  onUndo?: () => void;
  canUndo?: boolean;
  onSelectAll: () => void;
  totalEvents: number;
  selectedEventIds?: string[];
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkMove,
  onBulkDelete,
  onUndo,
  canUndo = false,
  onSelectAll,
  totalEvents,
  selectedEventIds = [],
}) => {
  const { t } = useTranslation();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkMove = async () => {
    setIsMoving(true);
    try {
      await onBulkMove(selectedDate);
      setShowMoveModal(false);
    } finally {
      setIsMoving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    
    setIsDeleting(true);
    try {
      await onBulkDelete(selectedEventIds);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {selectedCount}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedCount} {selectedCount === 1 ? "evento" : "eventos"}{" "}
                  seleccionado{selectedCount !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  de {totalEvents} total
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

            <div className="flex items-center gap-2">
              {selectedCount < totalEvents && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSelectAll}
                  className="whitespace-nowrap"
                >
                  Seleccionar todos
                </Button>
              )}

              {canUndo && onUndo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onUndo}
                  className="whitespace-nowrap"
                  title="Deshacer última operación"
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  Deshacer
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowMoveModal(true)}
                className="whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Mover eventos
              </Button>

              {onBulkDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}

              <button
                onClick={onClearSelection}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Limpiar selección"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <DynamicModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title="Mover eventos seleccionados"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Selecciona la nueva fecha y hora para mover los {selectedCount}{" "}
              eventos seleccionados.
            </p>

            <DateTimePicker
              selectedDate={selectedDate}
              onChange={setSelectedDate}
              showWarningForPastDates={true}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowMoveModal(false)}
              disabled={isMoving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkMove}
              disabled={isMoving}
              isLoading={isMoving}
            >
              Mover {selectedCount} evento{selectedCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DynamicModal>

      <DynamicModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar eventos seleccionados"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              ¿Estás seguro de que deseas eliminar los {selectedCount} eventos seleccionados? 
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              isLoading={isDeleting}
            >
              Eliminar {selectedCount} evento{selectedCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </>
  );
};
