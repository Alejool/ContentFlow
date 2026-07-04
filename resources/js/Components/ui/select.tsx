import * as React from 'react';
import { cn } from '@/lib/common/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid = false, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full cursor-pointer appearance-none rounded-lg border bg-white px-3 pr-8 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-100',
        invalid
          ? 'border-error-500 focus:ring-error-500'
          : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export { Select };
