import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

export interface TooltipProps {
  id: string;
  content: string | React.ReactNode;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const positionClasses: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const motionVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.1, ease: "easeIn" as const },
  },
};

export const Tooltip: React.FC<TooltipProps> = ({
  id,
  content,
  children,
  position = "top",
  dismissible = true,
  onDismiss,
}) => {
  return (
    <Popover className="relative inline-block">
      {({ open, close }) => (
        <>
          <PopoverButton className="inline-block focus:outline-none">
            {children}
          </PopoverButton>

          <AnimatePresence>
            {open && (
              <PopoverPanel
                static
                as={motion.div}
                variants={motionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`absolute z-[9999] max-w-xs ${positionClasses[position]}`}
              >
                <div className="rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-gray-800">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      {typeof content === "string" ? (
                        <p className="text-sm leading-relaxed">{content}</p>
                      ) : (
                        content
                      )}
                    </div>
                    {dismissible && (
                      <button
                        onClick={() => {
                          close();
                          onDismiss?.(id);
                        }}
                        className="flex-shrink-0 rounded p-1 flex items-center justify-center text-gray-400 transition-colors hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700"
                        aria-label="Dismiss tooltip"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </PopoverPanel>
            )}
          </AnimatePresence>
        </>
      )}
    </Popover>
  );
};
