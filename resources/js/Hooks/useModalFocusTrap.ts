import { useEffect, useRef } from 'react';
import { FocusManager } from '@/Utils/FocusManager';

/**
 * Hook to integrate FocusManager's trapFocus functionality with modal components
 * 
 * This hook automatically traps focus within a modal when it opens and restores
 * focus to the previously focused element when the modal closes.
 * 
 * Requirements: 5.5
 * 
 * @param isOpen - Whether the modal is currently open
 * @returns A ref to attach to the modal container element
 * 
 * @example
 * const MyModal = ({ isOpen, onClose }) => {
 *   const modalRef = useModalFocusTrap(isOpen);
 *   
 *   return (
 *     <div ref={modalRef} className="modal">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *     </div>
 *   );
 * };
 */
export function useModalFocusTrap(isOpen: boolean) {
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Trap focus when modal opens
      const cleanup = FocusManager.trapFocus(modalRef.current);
      
      // Restore focus when modal closes
      return () => {
        cleanup();
      };
    }
  }, [isOpen]);

  return modalRef;
}

export default useModalFocusTrap;
