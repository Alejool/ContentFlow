import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import React, { forwardRef } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  indeterminate?: boolean;
}

/**
 * Componente Checkbox moderno con animaciones
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      variant = 'primary',
      size = 'md',
      indeterminate = false,
      className = '',
      disabled = false,
      checked,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const variantClasses = {
      default: {
        border: 'border-gray-300 dark:border-gray-600',
        checked: 'bg-gray-600 border-gray-600 dark:bg-gray-500 dark:border-gray-500',
        hover: 'hover:border-gray-400 dark:hover:border-gray-500',
      },
      primary: {
        border: 'border-gray-300 dark:border-gray-600',
        checked: 'bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500',
        hover: 'hover:border-primary-400 dark:hover:border-primary-500',
      },
      success: {
        border: 'border-gray-300 dark:border-gray-600',
        checked: 'bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500',
        hover: 'hover:border-green-400 dark:hover:border-green-500',
      },
      danger: {
        border: 'border-gray-300 dark:border-gray-600',
        checked: 'bg-red-600 border-red-600 dark:bg-red-500 dark:border-red-500',
        hover: 'hover:border-red-400 dark:hover:border-red-500',
      },
    };

    const currentVariant = variantClasses[variant];

    return (
      <label
        className={`inline-flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
      >
        <div className="relative flex items-center">
          {/* Hidden native checkbox */}
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />

          {/* Custom checkbox */}
          <motion.div
            initial={false}
            animate={{
              scale: checked || indeterminate ? 1 : 1,
              backgroundColor: checked || indeterminate ? undefined : 'transparent',
            }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`
              ${sizeClasses[size]}
              flex items-center justify-center rounded-md border-2 transition-all duration-200
              ${checked || indeterminate ? currentVariant.checked : currentVariant.border}
              ${!disabled && !checked && !indeterminate ? currentVariant.hover : ''}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2
              dark:peer-focus-visible:ring-offset-gray-900
            `}
          >
            {/* Check icon */}
            {checked && !indeterminate && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Check className={`${iconSizes[size]} text-white`} strokeWidth={3} />
              </motion.div>
            )}

            {/* Indeterminate icon */}
            {indeterminate && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`${size === 'sm' ? 'h-0.5 w-2' : size === 'md' ? 'h-0.5 w-2.5' : 'h-1 w-3'} rounded-full bg-white`}
              />
            )}
          </motion.div>
        </div>

        {/* Label and description */}
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {label}
              </div>
            )}
            {description && (
              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {description}
              </div>
            )}
          </div>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
