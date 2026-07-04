/**
 * FieldShell.tsx — the shared chrome around every form control.
 *
 * Input, Textarea, Select and any future field render their control *inside*
 * this shell, which guarantees they all get the exact same label, required
 * marker, hint text, error/success message and icon/adornment slots. This is
 * what makes an Input and a Textarea feel like the same product.
 */
import { cn } from '@/lib/common/utils';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { renderIcon } from './Icon';
import { iconSize, labelSize } from './tokens';
import type { FieldChromeProps, IconLike, Size } from './types';

export interface FieldShellProps extends FieldChromeProps {
  id: string;
  size: Size;
  /** Icon shown inside the control on the left. */
  leftIcon?: IconLike | undefined;
  /** Icon (or interactive node) shown inside the control on the right. */
  rightIcon?: IconLike | undefined;
  /** The actual control (input/textarea/select), already styled. */
  children: ReactNode;
  containerClassName?: string | undefined;
  /** Multi-line controls align adornments to the top. */
  alignTop?: boolean | undefined;
}

export function FieldShell({
  id,
  size,
  label,
  hint,
  error,
  success,
  required,
  prefix,
  suffix,
  leftIcon,
  rightIcon,
  children,
  containerClassName,
  alignTop = false,
}: FieldShellProps) {
  const status = error ? 'error' : success ? 'success' : 'default';
  const message = error || success;
  const hasLeft = Boolean(leftIcon || prefix);
  const hasRight = Boolean(rightIcon || suffix);
  const adornAlign = alignTop ? 'top-2.5 items-start' : 'inset-y-0 items-center';

  return (
    <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'font-medium text-neutral-700 dark:text-neutral-300',
            labelSize[size],
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}

      <div className="relative w-full">
        {hasLeft && (
          <span
            className={cn(
              'pointer-events-none absolute left-3 flex text-neutral-400',
              adornAlign,
            )}
          >
            {prefix ?? renderIcon(leftIcon, iconSize[size])}
          </span>
        )}

        {children}

        {hasRight && (
          <span
            className={cn(
              'absolute right-3 flex text-neutral-400',
              adornAlign,
              // right adornments may be interactive (password toggle, clear…)
              rightIcon ? '' : 'pointer-events-none',
            )}
          >
            {suffix ?? renderIcon(rightIcon, iconSize[size])}
          </span>
        )}
      </div>

      {message ? (
        <p
          className={cn(
            'flex items-center gap-1 text-xs',
            status === 'error' ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-400',
          )}
        >
          {status === 'error' ? (
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {message}
        </p>
      ) : (
        hint && <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
      )}
    </div>
  );
}

/** Left/right padding a control needs so text clears its adornments. */
export function fieldPadding(hasLeft: boolean, hasRight: boolean): string {
  return cn(hasLeft && 'pl-10', hasRight && 'pr-10');
}
