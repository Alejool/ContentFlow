import { CheckCircle, TriangleAlert } from 'lucide-react';
import { ReactNode } from 'react';
import {
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    Text
} from 'react-aria-components';

import Label from '@/Components/common/Modern/Label';

export interface ListBoxItemType {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  textValue?: string;
}

interface ListBoxProps {
  id?: string;
  label?: string;
  items: ListBoxItemType[];
  selectedKeys?: Set<string> | 'all';
  defaultSelectedKeys?: Set<string> | 'all';
  onSelectionChange?: (keys: Set<string>) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  disabledKeys?: string[];
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  variant?: 'default' | 'bordered' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  emptyState?: ReactNode;
  className?: string;
}

export default function ListBox({
  id = 'listbox',
  label,
  items,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  selectionMode = 'single',
  disabledKeys = [],
  error,
  success,
  hint,
  required = false,
  variant = 'default',
  size = 'md',
  emptyState,
  className = '',
}: ListBoxProps) {
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2',
    md: 'text-sm py-2.5 px-3',
    lg: 'text-base py-3 px-4',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getContainerClasses = () => {
    const base = 'rounded-lg transition-all duration-200';

    if (error) {
      return `${base} border-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10`;
    }

    if (success) {
      return `${base} border-2 border-green-500 bg-green-50/50 dark:bg-green-900/10`;
    }

    if (variant === 'bordered') {
      return `${base} border-2 border-gray-300 bg-white dark:border-neutral-700 dark:bg-neutral-900`;
    }

    if (variant === 'flat') {
      return `${base} bg-gray-50 dark:bg-neutral-800`;
    }

    // default
    return `${base} border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900`;
  };

  return (
    <div className={className}>
      {label && (
        <Label
          htmlFor={id}
          size={size === 'md' ? 'md' : size === 'lg' ? 'lg' : 'sm'}
          required={required}
          error={error}
          success={success}
          variant="default"
          align="left"
          className="mb-2"
        >
          {label}
        </Label>
      )}

      {hint && !label && (
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}

      <AriaListBox
        aria-label={label || 'List'}
        items={items}
        selectedKeys={selectedKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        onSelectionChange={(keys) => {
          if (keys === 'all') {
            onSelectionChange?.(new Set(items.map((item) => item.id)));
          } else {
            onSelectionChange?.(keys as Set<string>);
          }
        }}
        selectionMode={selectionMode}
        disabledKeys={disabledKeys}
        className={`max-h-64 overflow-auto ${getContainerClasses()}`}
        renderEmptyState={() => (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {emptyState || (
              <>
                <div className="mb-2 text-gray-400 dark:text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No items available
                </p>
              </>
            )}
          </div>
        )}
      >
        {(item) => (
          <AriaListBoxItem
            id={item.id}
            textValue={item.textValue || item.label}
            className={({ isSelected, isHovered, isFocusVisible, isDisabled }) => {
              const baseClasses = `
                flex items-center gap-3 ${sizeClasses[size]} cursor-pointer transition-all duration-150
                ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
                ${isFocusVisible ? 'outline-none ring-2 ring-inset ring-primary-500' : ''}
              `;

              if (isSelected) {
                return `${baseClasses} bg-primary-500 text-white font-semibold`;
              }

              if (isHovered && !isDisabled) {
                return `${baseClasses} bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-white`;
              }

              return `${baseClasses} text-gray-700 dark:text-gray-300`;
            }}
          >
            {({ isSelected }) => (
              <>
                {item.icon && (
                  <div className={`flex-shrink-0 ${iconSizes[size]}`}>{item.icon}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{item.label}</span>
                    {isSelected && selectionMode !== 'none' && (
                      <CheckCircle className={`flex-shrink-0 ${iconSizes[size]}`} />
                    )}
                  </div>
                  {item.description && (
                    <Text
                      slot="description"
                      className={`mt-0.5 truncate text-xs ${
                        isSelected
                          ? 'text-white/80'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {item.description}
                    </Text>
                  )}
                </div>
              </>
            )}
          </AriaListBoxItem>
        )}
      </AriaListBox>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-start gap-2 text-sm text-primary-600" role="alert">
          <TriangleAlert className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && !error && (
        <div className="mt-2 flex items-start gap-2 text-sm text-green-600" role="status">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
