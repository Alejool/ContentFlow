/**
 * Animated Modal Component
 * 
 * Accessible modal with animations, focus trap, and keyboard navigation
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useFocusTrap, useKeyboardNavigation } from '@/Hooks/useKeyboardNavigation';
import { useReducedMotion } from '@/Hooks/useReducedMotion';
import { VisuallyHidden } from '../Accessibility/VisuallyHidden';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Focus trap
  useFocusTrap(modalRef, isOpen);

  // Keyboard navigation
  useKeyboardNavigation(modalRef, {
    onEscape: closeOnEscape ? onClose : undefined,
    enabled: isOpen,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const overlayVariants = reducedMotion
    ? {}
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      };

  const modalVariants = reducedMotion
    ? {}
    : {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
      };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className={`
              relative w-full ${sizeStyles[size]}
              bg-theme-bg-elevated
              rounded-xl shadow-2xl
              border border-theme-border-default
              overflow-hidden
            `}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby={description ? 'modal-description' : undefined}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-theme-border-default">
              <div className="flex items-start justify-between">
                <div>
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold text-theme-text-primary"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p
                      id="modal-description"
                      className="mt-1 text-sm text-theme-text-secondary"
                    >
                      {description}
                    </p>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="
                    ml-4 p-2 rounded-lg
                    text-theme-text-tertiary
                    hover:bg-theme-interactive-hover
                    focus-ring
                    transition-colors duration-fast
                  "
                  aria-label="Cerrar modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
