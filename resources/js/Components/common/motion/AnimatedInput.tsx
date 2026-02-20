/**
 * Animated Input Component
 * 
 * Input with focus animations and accessibility features
 */

import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion } from '@/Utils/themeTransition';

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const reducedMotion = prefersReducedMotion();
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = `
      w-full px-4 py-2
      bg-theme-bg-primary
      border-2 border-theme-border-default
      rounded-lg
      text-theme-text-primary
      placeholder:text-theme-text-tertiary
      transition-all duration-fast
      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
      disabled:opacity-50 disabled:cursor-not-allowed
      ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : ''}
      ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <motion.label
            htmlFor={inputId}
            className="block text-sm font-medium text-theme-text-primary mb-1.5"
            initial={false}
            animate={
              reducedMotion
                ? {}
                : {
                    color: isFocused
                      ? 'var(--theme-text-primary)'
                      : 'var(--theme-text-secondary)',
                  }
            }
            transition={{ duration: 0.15 }}
          >
            {label}
            {props.required && (
              <span className="text-error-500 ml-1" aria-label="requerido">
                *
              </span>
            )}
          </motion.label>
        )}

        <div className="relative">
          {icon && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                iconPosition === 'left' ? 'left-3' : 'right-3'
              } text-theme-text-tertiary pointer-events-none`}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />
        </div>

        {error && (
          <motion.p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-error-600"
            role="alert"
            initial={reducedMotion ? {} : { opacity: 0, y: -4 }}
            animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-theme-text-tertiary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';
