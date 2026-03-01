/**
 * Animated Toast Component
 * 
 * Toast notifications with animations and accessibility
 */

import React, { useEffect } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '@/Hooks/useReducedMotion';
import { useAnnounce } from '../Accessibility/LiveRegion';

interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const typeStyles = {
  success: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-500',
    text: 'text-success-800 dark:text-success-200',
    icon: '✓',
  },
  error: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    border: 'border-error-500',
    text: 'text-error-800 dark:text-error-200',
    icon: '✕',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-500',
    text: 'text-warning-800 dark:text-warning-200',
    icon: '⚠',
  },
  info: {
    bg: 'bg-info-50 dark:bg-info-900/20',
    border: 'border-info-500',
    text: 'text-info-800 dark:text-info-200',
    icon: 'ℹ',
  },
};

export const AnimatedToast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  const reducedMotion = useReducedMotion();
  const { announce } = useAnnounce();
  const styles = typeStyles[type];

  useEffect(() => {
    // Announce to screen readers
    announce(message, { politeness: type === 'error' ? 'assertive' : 'polite' });

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, message, type, duration, onClose, announce]);

  const variants = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: -20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
      };

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        layout
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`
          flex items-start gap-3 p-4 rounded-lg shadow-lg
          border-l-4 ${styles.border}
          ${styles.bg}
          min-w-[320px] max-w-md
        `}
        role="alert"
        aria-live={type === 'error' ? 'assertive' : 'polite'}
      >
        <span className={`text-xl ${styles.text}`} aria-hidden="true">
          {styles.icon}
        </span>

        <p className={`flex-1 text-sm font-medium ${styles.text}`}>
          {message}
        </p>

        <button
          onClick={() => onClose(id)}
          className={`
            p-1 rounded hover:bg-black/10 dark:hover:bg-white/10
            transition-colors duration-fast
            focus-ring
            ${styles.text}
          `}
          aria-label="Cerrar notificación"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </m.div>
    </LazyMotion>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  const content = (
    <div
      className={`fixed ${positionStyles[position]} z-50 flex flex-col gap-2`}
      aria-label="Notificaciones"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <AnimatedToast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );

  return createPortal(content, document.body);
};
