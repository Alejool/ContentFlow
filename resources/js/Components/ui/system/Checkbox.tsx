/**
 * Checkbox — boolean control sharing the system's tone + size scale.
 *
 * Optional `label` / `description` render the same way as other fields, and
 * `tone` colours the checked state with the same palette used across the DS.
 */
import { cn } from '@/lib/common/utils';
import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { Tone } from './types';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'className'> {
  label?: string;
  description?: string;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  containerClassName?: string;
}

const boxSize = { sm: 'h-4 w-4', md: 'h-4.5 w-4.5', lg: 'h-5 w-5' };

const toneChecked: Record<Tone, string> = {
  primary: 'text-primary-600 focus:ring-primary-500',
  secondary: 'text-secondary-600 focus:ring-secondary-500',
  neutral: 'text-neutral-700 focus:ring-neutral-500',
  success: 'text-success-600 focus:ring-success-500',
  warning: 'text-warning-600 focus:ring-warning-500',
  danger: 'text-error-600 focus:ring-error-500',
  info: 'text-info-600 focus:ring-info-500',
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, tone = 'primary', size = 'md', className, containerClassName, id, disabled, ...props }, ref) => {
    const reactId = useId();
    const fieldId = id ?? reactId;

    const control = (
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        disabled={disabled}
        className={cn(
          'shrink-0 cursor-pointer rounded border-neutral-300 focus:ring-2 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900',
          boxSize[size],
          toneChecked[tone],
          className,
        )}
        {...props}
      />
    );

    if (!label && !description) return control;

    return (
      <div className={cn('flex items-start gap-2', containerClassName)}>
        <div className="flex h-5 items-center">{control}</div>
        <div className="flex flex-col">
          {label && (
            <label htmlFor={fieldId} className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{description}</span>
          )}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
