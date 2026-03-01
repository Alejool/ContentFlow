/**
 * Animated Switch Component
 * 
 * Toggle switch with animations and full accessibility support
 */

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { prefersReducedMotion } from '@/Utils/themeTransition';

interface AnimatedSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const AnimatedSwitch = forwardRef<HTMLInputElement, AnimatedSwitchProps>(
  (
    {
      label,
      description,
      checked,
      onCheckedChange,
      onChange,
      disabled,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const reducedMotion = prefersReducedMotion();
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    const spring = {
      type: 'spring',
      stiffness: 700,
      damping: 30,
    };

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            role="switch"
            aria-checked={checked}
            aria-describedby={description ? `${switchId}-description` : undefined}
            {...props}
          />
          
          <label
            htmlFor={switchId}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full
              transition-colors duration-fast
              cursor-pointer
              peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2
              peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              ${
                checked
                  ? 'bg-primary-600'
                  : 'bg-theme-border-strong'
              }
            `}
          >
            <LazyMotion features={domAnimation}>
              <m.span
                className={`
                  inline-block h-4 w-4 rounded-full bg-white shadow-sm
                `}
                initial={false}
                animate={{
                  x: checked ? 24 : 4,
                }}
                transition={reducedMotion ? { duration: 0 } : spring}
              />
            </LazyMotion>
          </label>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className="text-sm font-medium text-theme-text-primary cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${switchId}-description`}
                className="text-sm text-theme-text-tertiary"
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

AnimatedSwitch.displayName = 'AnimatedSwitch';
