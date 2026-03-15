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
      <div className="animate-slide-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {selectedCount}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedCount}{" "}
                  {t(selectedCount === 1 ? "calendar.event" : "calendar.events.count")}{" "}
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
                  variant="ghost"
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
                  <Undo2 className="mr-2 h-4 w-4" />
                  {t("calendar.undo")}
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowMoveModal(true)}
                className="whitespace-nowrap"
                icon={Calendar}
              >
                {t("calendar.moveEvents")}
              </Button>
              <button
                onClick={onClearSelection}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title={t("calendar.clearSelection")}
              >
                <X className="h-5 w-5 text-gray-500" />
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
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-100">
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
                className="rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("calendar.selected_date")}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t("calendar.preserveOriginalTime")}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="ghost" onClick={() => setShowMoveModal(false)} disabled={isMoving}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkMove}
              disabled={isMoving}
              loading={isMoving}
              icon={Calendar}
            >
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-red-900 dark:text-red-100">
                  {t("calendar.confirmDelete")}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t("calendar.deleteWarning", { count: selectedCount })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
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
              <Trash2 className="mr-2 h-4 w-4" />
              {t("calendar.deleteCount", { count: selectedCount })}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </>
  );
};
