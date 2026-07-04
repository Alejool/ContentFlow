/**
 * Input — single-line text field on the shared FieldShell.
 *
 * Same config surface as Textarea and Select: `size`, `radius`,
 * `error`/`success`/`hint`, `label`, `required`, `leftIcon`/`rightIcon`,
 * `prefix`/`suffix`, plus a built-in password toggle. Reads all geometry and
 * status colours from the system tokens.
 */
import { cn } from '@/lib/common/utils';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { FieldShell } from './FieldShell';
import { fieldBase, radius as radiusTokens } from './tokens';
import { fieldStatus } from './tone';
import type { FieldChromeProps, IconLike, Radius, Size } from './types';

export interface InputProps
  extends FieldChromeProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'className'> {
  size?: Size;
  radius?: Radius;
  leftIcon?: IconLike;
  rightIcon?: IconLike;
  /** Show a show/hide toggle (implies type="password"). */
  passwordToggle?: boolean;
  className?: string;
  containerClassName?: string;
}

/** Height without the text padding baked into controlSize. */
const inputHeight: Record<Size, string> = {
  xs: 'h-7 text-xs',
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-11 text-base',
  xl: 'h-12 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      size = 'md',
      radius = 'md',
      type = 'text',
      label,
      hint,
      error,
      success,
      required,
      prefix,
      suffix,
      leftIcon,
      rightIcon,
      passwordToggle = false,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const fieldId = id ?? reactId;
    const [reveal, setReveal] = useState(false);
    const status = error ? 'error' : success ? 'success' : 'default';

    const resolvedType = passwordToggle ? (reveal ? 'text' : 'password') : type;
    const hasLeft = Boolean(leftIcon || prefix);
    const toggle = passwordToggle ? (
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setReveal((v) => !v)}
        className="pointer-events-auto text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-200"
        aria-label={reveal ? 'Hide password' : 'Show password'}
      >
        {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    ) : undefined;
    const rightNode = toggle ?? rightIcon;
    const hasRight = Boolean(rightNode || suffix);

    return (
      <FieldShell
        id={fieldId}
        size={size}
        label={label}
        hint={hint}
        error={error}
        success={success}
        required={required}
        prefix={prefix}
        suffix={suffix}
        leftIcon={leftIcon}
        rightIcon={rightNode}
        containerClassName={containerClassName}
      >
        <input
          ref={ref}
          id={fieldId}
          type={resolvedType}
          disabled={disabled}
          aria-invalid={status === 'error' || undefined}
          className={cn(
            fieldBase,
            inputHeight[size],
            radiusTokens[radius],
            fieldStatus[status],
            hasLeft ? 'pl-10' : 'px-3',
            hasRight ? 'pr-10' : !hasLeft ? '' : 'pr-3',
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

Input.displayName = 'Input';
