/**
 * Textarea — multi-line field sharing Input's exact chrome and API.
 *
 * Adds `showCount` (character counter against `maxLength`) but is otherwise
 * driven by the same `size` / `radius` / `error` / `success` / `hint` /
 * `label` / icon props, so switching between Input and Textarea needs no
 * mental context switch.
 */
import { cn } from '@/lib/common/utils';
import { forwardRef, useId, useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { FieldShell } from './FieldShell';
import { fieldBase, radius as radiusTokens, textareaSize } from './tokens';
import { fieldStatus } from './tone';
import type { FieldChromeProps, IconLike, Radius, Size } from './types';

export interface TextareaProps
  extends FieldChromeProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix' | 'className'> {
  size?: Size;
  radius?: Radius;
  leftIcon?: IconLike;
  /** Show a live character counter (uses `maxLength`). */
  showCount?: boolean;
  className?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      size = 'md',
      radius = 'md',
      rows = 4,
      label,
      hint,
      error,
      success,
      required,
      leftIcon,
      showCount = false,
      maxLength,
      className,
      containerClassName,
      disabled,
      defaultValue,
      onChange,
      prefix: _prefix,
      suffix: _suffix,
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const fieldId = id ?? reactId;
    const status = error ? 'error' : success ? 'success' : 'default';
    const [count, setCount] = useState(String(defaultValue ?? props.value ?? '').length);

    const counter =
      showCount && maxLength ? (
        <span className="text-xs tabular-nums text-neutral-400">
          {count}/{maxLength}
        </span>
      ) : undefined;

    return (
      <FieldShell
        id={fieldId}
        size={size}
        label={label}
        hint={counter ?? hint}
        error={error}
        success={success}
        required={required}
        leftIcon={leftIcon}
        containerClassName={containerClassName}
        alignTop
      >
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={status === 'error' || undefined}
          defaultValue={defaultValue}
          onChange={(e) => {
            setCount(e.target.value.length);
            onChange?.(e);
          }}
          className={cn(
            fieldBase,
            'min-h-20 resize-y',
            textareaSize[size],
            radiusTokens[radius],
            fieldStatus[status],
            leftIcon && 'pl-10',
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

Textarea.displayName = 'Textarea';
