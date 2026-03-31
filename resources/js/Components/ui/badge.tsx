import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-primary hover:bg-primary/80 border-transparent text-primary-400':
            variant === 'default',
          'bg-secondary hover:bg-secondary/80 border-transparent text-secondary-500':
            variant === 'secondary',
          'bg-destructive text-destructive-200 hover:bg-destructive/80 border-transparent':
            variant === 'destructive',
          'text-foreground': variant === 'outline',
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
