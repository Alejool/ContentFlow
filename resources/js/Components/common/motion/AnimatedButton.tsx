/**
 * Animated Button Component
 * 
 * Button with microinteractions and accessibility features
 */

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { prefersReducedMotion } from '@/Utils/themeTransition';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white focus-ring',
  secondary: 'bg-theme-bg-secondary hover:bg-theme-bg-tertiary text-theme-text-primary border border-theme-border-default focus-ring',
  ghost: 'bg-transparent hover:bg-theme-interactive-hover text-theme-text-primary focus-ring',
  danger: 'bg-error-600 hover:bg-error-700 text-white focus-ring',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const reducedMotion = prefersReducedMotion();

    const motionProps: MotionProps = reducedMotion
      ? {}
      : {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.15, ease: 'easeInOut' },
        };

    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-fast
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        {...motionProps}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span aria-hidden="true">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span aria-hidden="true">{icon}</span>
        )}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
