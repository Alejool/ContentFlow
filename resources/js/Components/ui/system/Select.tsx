/**
 * Select — native select styled to match Input exactly.
 *
 * Same `size` / `radius` / `error` / `success` / `hint` / `label` / icon
 * surface as the other fields. Accepts either `options` for the common case or
 * `children` (`<option>`s) for full control.
 */
import { cn } from '@/lib/common/utils';
import { ChevronDown } from 'lucide-react';
import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { FieldShell } from './FieldShell';
import { fieldBase, radius as radiusTokens } from './tokens';
import { fieldStatus } from './tone';
import type { FieldChromeProps, IconLike, Radius, Size } from './types';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends FieldChromeProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'prefix' | 'className'> {
  size?: Size;
  radius?: Radius;
  leftIcon?: IconLike;
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
  containerClassName?: string;
}

const selectHeight: Record<Size, string> = {
  xs: 'h-7 text-xs',
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-11 text-base',
  xl: 'h-12 text-base',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      size = 'md',
      radius = 'md',
      label,
      hint,
      error,
      success,
      required,
      leftIcon,
      options,
      placeholder,
      children,
      className,
      containerClassName,
      disabled,
      prefix: _prefix,
      suffix: _suffix,
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const fieldId = id ?? reactId;
    const status = error ? 'error' : success ? 'success' : 'default';
    const hasLeft = Boolean(leftIcon);

    return (
      <FieldShell
        id={fieldId}
        size={size}
        label={label}
        hint={hint}
        error={error}
        success={success}
        required={required}
        leftIcon={leftIcon}
        // Chevron adornment on the right; not interactive.
        rightIcon={ChevronDown}
        containerClassName={containerClassName}
      >
        <select
          ref={ref}
          id={fieldId}
          disabled={disabled}
          aria-invalid={status === 'error' || undefined}
          className={cn(
            fieldBase,
            'cursor-pointer appearance-none',
            selectHeight[size],
            radiusTokens[radius],
            fieldStatus[status],
            hasLeft ? 'pl-10' : 'pl-3',
            'pr-10',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
      </FieldShell>
    );
  },
);

Select.displayName = 'Select';
