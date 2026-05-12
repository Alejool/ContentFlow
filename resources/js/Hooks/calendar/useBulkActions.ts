import { useState } from 'react';

interface UseBulkActionsProps {
  onBulkMove: (newDate: Date) => Promise<void>;
  onBulkDelete?: (eventIds: string[]) => Promise<void> | undefined;
  selectedEventIds?: string[];
}

interface UseBulkActionsReturn {
  // Move modal state
  showMoveModal: boolean;
  setShowMoveModal: (show: boolean) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isMoving: boolean;
  handleBulkMove: () => Promise<void>;
  
  // Delete modal state
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  isDeleting: boolean;
  handleBulkDelete: () => Promise<void>;
}

/**
 * Hook personalizado para manejar las acciones masivas del calendario
 */
export function useBulkActions({
  onBulkMove,
  onBulkDelete,
  selectedEventIds = [],
}: UseBulkActionsProps): UseBulkActionsReturn {
  // Move modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [isMoving, setIsMoving] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Maneja el movimiento masivo de eventos
   */
  const handleBulkMove = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validar que la fecha no esté en el pasado
    if (selectedDate < today) {
      return;
    }

    setIsMoving(true);
    try {
      await onBulkMove(selectedDate);
      setShowMoveModal(false);
    } finally {
      setIsMoving(false);
    }
  };

  /**
   * Maneja la eliminación masiva de eventos
   */
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

  return {
    // Move modal
    showMoveModal,
    setShowMoveModal,
    selectedDate,
    setSelectedDate,
    isMoving,
    handleBulkMove,
    
    // Delete modal
    showDeleteModal,
    setShowDeleteModal,
    isDeleting,
    handleBulkDelete,
  };
}
