import React, { useEffect, useRef, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
} from '@floating-ui/react';
import { X } from 'lucide-react';

export interface TooltipProps {
  id: string;
  content: string | React.ReactNode;
  targetElement?: HTMLElement | null;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
  autoHideDelay?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tooltip Component
 * 
 * Displays contextual help near UI elements using Floating UI for intelligent positioning.
 * Supports hover/tap interactions, auto-hide, dismissal, and rich content.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 7.3
 */
export const Tooltip: React.FC<TooltipProps> = ({
  id,
  content,
  targetElement,
  children,
  position = 'auto',
  dismissible = true,
  onDismiss,
  autoHideDelay = 5000,
  isOpen: controlledIsOpen,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const arrowRef = useRef(null);

  // Determine if controlled or uncontrolled
  const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;
  const setOpen = (value: boolean) => {
    if (controlledIsOpen === undefined) {
      setIsOpen(value);
    }
    onOpenChange?.(value);
  };

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
  }, []);

  // Convert position to Floating UI placement
  const placement = position === 'auto' ? 'top' : position;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Interaction hooks
  const hover = useHover(context, {
    enabled: !isTouchDevice,
    delay: { open: 300, close: 200 }, // Requirement 2.1, 2.3
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  // Auto-hide after delay (Requirement 2.3)
  useEffect(() => {
    if (open && autoHideDelay > 0) {
      autoHideTimerRef.current = setTimeout(() => {
        setOpen(false);
      }, autoHideDelay);
    }

    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [open, autoHideDelay]);

  // Handle tap on touch devices (Requirement 7.3)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTouchDevice) {
      e.preventDefault();
      setOpen(!open);
    }
  };

  // Handle dismiss button click (Requirement 2.4)
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onDismiss?.(id);
  };

  // Set reference element
  useEffect(() => {
    if (targetElement) {
      refs.setReference(targetElement);
    }
  }, [targetElement, refs]);

  return (
    <>
      {children && (
        <div
          ref={refs.setReference}
          {...getReferenceProps()}
          onTouchStart={handleTouchStart}
          className="inline-block"
        >
          {children}
        </div>
      )}

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[9999] max-w-xs rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-gray-800"
          >
            <FloatingArrow
              ref={arrowRef}
              context={context}
              className="fill-gray-900 dark:fill-gray-800"
            />
            
            <div className="flex items-start gap-2">
              <div className="flex-1">
                {typeof content === 'string' ? (
                  <p className="text-sm leading-relaxed">{content}</p>
                ) : (
                  content
                )}
              </div>
              
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 transition-colors hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700"
                  aria-label="Dismiss tooltip"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
