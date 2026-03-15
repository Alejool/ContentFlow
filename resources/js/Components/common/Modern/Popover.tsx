import { ReactNode } from 'react';
import {
    Button as AriaButton,
    Popover as AriaPopover,
    PopoverProps as AriaPopoverProps,
    Dialog,
    DialogTrigger,
} from 'react-aria-components';

interface PopoverProps extends Omit<AriaPopoverProps, 'children'> {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}

/**
 * Popover component using React Aria Components
 * 
 * Features:
 * - Smart positioning (avoids overflow)
 * - Automatic focus management
 * - ESC key to close
 * - Backdrop overlay support
 * 
 * @example
 * <Popover
 *   trigger={<button>Open</button>}
 *   placement="bottom"
 * >
 *   <div>Popover content</div>
 * </Popover>
 */
export function Popover({
  trigger,
  children,
  className = '',
  triggerClassName = '',
  placement = 'bottom',
  offset = 8,
  ...props
}: PopoverProps) {
  return (
    <DialogTrigger>
      <AriaButton className={triggerClassName}>{trigger}</AriaButton>
      <AriaPopover
        placement={placement}
        offset={offset}
        className={({ isEntering, isExiting }) =>
          `
          overflow-hidden rounded-lg border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl
          dark:border-neutral-800/90 dark:bg-neutral-900
          ${isEntering ? 'animate-in fade-in-0 zoom-in-95 duration-150' : ''}
          ${isExiting ? 'animate-out fade-out-0 zoom-out-95 duration-100' : ''}
          ${className}
        `.trim()
        }
        {...props}
      >
        <Dialog className="focus:outline-none">{children}</Dialog>
      </AriaPopover>
    </DialogTrigger>
  );
}
