import { Dialog, DialogPanel } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode } from 'react';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface ModalProps {
  children: ReactNode;
  show?: boolean;
  maxWidth?: MaxWidth;
  closeable?: boolean;
  onClose?: () => void;
}

export default function Modal({
  children,
  show = false,
  maxWidth = '2xl',
  closeable = true,
  onClose = () => {},
}: ModalProps) {
  const close = () => {
    if (closeable) {
      onClose();
    }
  };

  const maxWidthMap: Record<MaxWidth, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
  };
  const maxWidthClass = maxWidthMap[maxWidth];

  return (
    <AnimatePresence mode="wait">
      {show && (
        <Dialog
          static
          as="div"
          open={show}
          onClose={close}
          className="fixed inset-0 z-[9999]"
        >
          {/* Backdrop animado con Framer Motion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm dark:bg-black/80"
            onClick={close}
          />

          {/* Contenedor centrado con scroll */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="w-full"
              >
                <DialogPanel
                  className={`relative mx-auto w-full overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10 ${maxWidthClass}`}
                >
                  {children}
                </DialogPanel>
              </motion.div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
