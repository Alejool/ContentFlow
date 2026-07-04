import * as React from 'react';
import { cn } from '@/lib/common/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-100',
        invalid
          ? 'border-error-500 focus:ring-error-500'
          : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
