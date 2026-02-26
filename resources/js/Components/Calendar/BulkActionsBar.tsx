import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import { Calendar, X, Undo2, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  // Initialize with today's date at current time
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day
    return now;
  });
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkMove = async () => {
    // Validate that the selected date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return; // Date is in the past
    }

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
                  {selectedCount} {t(selectedCount === 1 ? "calendar.event" : "calendar.events")}{" "}
                  {t("calendar.selected")}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("calendar.of")} {totalEvents} {t("calendar.total")}
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
                  {t("calendar.selectAll")}
                </Button>
              )}

              {canUndo && onUndo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onUndo}
                  className="whitespace-nowrap"
                  title={t("calendar.undoLastOperation")}
                >
                  <Undo2 className="w-4 h-4 mr-2" />
                  {t("calendar.undo")}
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowMoveModal(true)}
                className="whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t("calendar.moveEvents")}
              </Button>

              {onBulkDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("calendar.delete")}
                </Button>
              )}

              <button
                onClick={onClearSelection}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={t("calendar.clearSelection")}
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
        title={t("calendar.moveSelectedEvents")}
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  {t("calendar.movingEvents", { count: selectedCount })}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t("calendar.selectNewDateTime")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("calendar.newDateAndTime")}
            </label>
            <div className="flex justify-center">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    // Ensure the date is set to start of day
                    const newDate = new Date(date);
                    newDate.setHours(0, 0, 0, 0);
                    setSelectedDate(newDate);
                  }
                }}
                minDate={new Date()}
                dateFormat="MMMM d, yyyy"
                inline
                className="border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("calendar.selected_date")}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {selectedDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t("calendar.preserveOriginalTime")}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowMoveModal(false)}
              disabled={isMoving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkMove}
              disabled={isMoving}
              loading={isMoving}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t("calendar.moveCount", { count: selectedCount })}
            </Button>
          </div>
        </div>
      </DynamicModal>

      <DynamicModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t("calendar.deleteSelectedEvents")}
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  {t("calendar.confirmDelete")}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t("calendar.deleteWarning", { count: selectedCount })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              loading={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("calendar.deleteCount", { count: selectedCount })}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </>
  );
};
