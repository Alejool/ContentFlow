import Label from '@/Components/common/Modern/Label';
import { AlertCircle, Check, CheckCircle, ChevronDown, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FieldValues, Path, UseFormRegister } from 'react-hook-form';

interface DropdownPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  selectRect: DOMRect | null;
  dropdownDirection: 'up' | 'down';
  usePortal?: boolean;
}

function DropdownPortal({
  children,
  isOpen,
  selectRect,
  dropdownDirection,
  usePortal = true,
}: DropdownPortalProps) {
  const [mounted, setMounted] = useState(false);
  // Ref on the inner content div so we can measure scrollHeight without
  // passing ref to motion.div (which causes the framer-motion PopChild
  // "ref is not a prop" warning in React 18+).
  const contentRef = useRef<HTMLDivElement>(null);
  // Computed portal position driven by state — avoids direct DOM style mutation
  // on the animated element.
  const [portalPosition, setPortalPosition] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!usePortal || !isOpen || !selectRect) return;

    const viewportHeight = window.innerHeight;
    // Use measured scrollHeight when available, fall back to maxHeight (240).
    const dropdownHeight = contentRef.current
      ? Math.min(contentRef.current.scrollHeight, 240)
      : 240;

    const next: React.CSSProperties = {
      left: selectRect.left,
      minWidth: selectRect.width,
      width: 'auto',
    };

    if (dropdownDirection === 'up') {
      const topPosition = selectRect.top - dropdownHeight - 4;
      next.top = topPosition > 0 ? topPosition : selectRect.bottom + 4;
      next.bottom = 'auto';
    } else {
      const fitsBelow = viewportHeight - (selectRect.bottom + 4 + dropdownHeight);
      next.top = fitsBelow > 0
        ? selectRect.bottom + 4
        : selectRect.top - dropdownHeight - 4;
      next.bottom = 'auto';
    }

    setPortalPosition(next);
  }, [isOpen, selectRect, dropdownDirection, usePortal]);

  if (usePortal && !mounted) return null;

  const baseStyles: React.CSSProperties = {
    position: usePortal ? 'fixed' : 'absolute',
    zIndex: 9999,
    maxHeight: '240px',
    overflowY: 'auto',
    borderRadius: '0.5rem',
    borderWidth: '1px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    ...(usePortal ? portalPosition : { width: '100%', minWidth: '120px' }),
  };

  const motionVariants = {
    hidden: {
      opacity: 0,
      scale: 0.96,
      y: dropdownDirection === 'up' ? 6 : -6,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: dropdownDirection === 'up' ? 6 : -6,
      transition: { duration: 0.1, ease: 'easeIn' },
    },
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          // No ref here — avoids framer-motion PopChild passing ref as prop
          style={baseStyles}
          variants={motionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`border border-gray-200 bg-white dark:border-neutral-700 dark:bg-theme-bg-secondary ${
            !usePortal
              ? dropdownDirection === 'up'
                ? 'bottom-full left-0 mb-1'
                : 'top-full left-0 mt-1'
              : ''
          }`}
        >
          <div ref={contentRef}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!usePortal) {
    return content;
  }

  return createPortal(content, document.body);
}

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

interface SelectProps<T extends FieldValues = FieldValues> {
  id: string;
  label?: string | undefined;
  error?: string | undefined;
  success?: string | undefined;
  register?: UseFormRegister<T> | undefined;
  name?: Path<T> | undefined;
  options: Option[];
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  containerClassName?: string | undefined;
  icon?: any;
  hint?: string | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  variant?: 'default' | 'outlined' | 'filled' | undefined;
  required?: boolean | undefined;
  value?: string | number | string[] | undefined;
  onChange?: ((value: string | number | string[]) => void) | undefined;
  searchable?: boolean | undefined;
  clearable?: boolean | undefined;
  loading?: boolean | undefined;
  dropdownPosition?: 'down' | 'up' | 'auto' | undefined;
  usePortal?: boolean | undefined;
  activeColor?: string | undefined;
  multiple?: boolean | undefined;
}

export default function Select<T extends FieldValues>({
  id,
  label,
  error,
  success,
  register,
  name,
  options,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  containerClassName = '',
  icon: Icon,
  hint,
  size = 'md',
  variant = 'default',
  required = false,
  value,
  onChange,
  searchable = false,
  clearable = false,
  loading = false,
  dropdownPosition = 'auto',
  usePortal = true,
  activeColor,
  multiple = false,
  ...props
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedLabel = useMemo(() => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const selected = options.find((option) => option.value === value[0]);
        return selected?.label || placeholder;
      }
      return `${value.length} seleccionadas`;
    }
    if (value !== undefined && value !== null && value !== '') {
      const selected = options.find((option) => option.value === value);
      return selected?.label || placeholder;
    }
    return placeholder;
  }, [value, options, placeholder, multiple]);
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>(
    dropdownPosition === 'auto' ? 'down' : dropdownPosition,
  );
  const [selectRect, setSelectRect] = useState<DOMRect | null>(null);

  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = {
    sm: {
      select: 'py-1 px-2 text-sm',
      icon: 'w-4 h-4',
      label: 'text-xs',
      option: 'py-2 px-3 text-sm',
      search: 'py-2 px-3 text-sm',
    },
    md: {
      select: 'py-2 px-3 text-base',
      icon: 'w-5 h-5',
      label: 'text-sm',
      option: 'py-2.5 px-4 text-base',
      search: 'py-2.5 px-4 text-base',
    },
    lg: {
      select: 'py-3 px-4 text-lg',
      icon: 'w-6 h-6',
      label: 'text-base',
      option: 'py-2 px-3 text-lg',
      search: 'py-2 px-3 text-lg',
    },
  };

  const currentSize = sizeConfig[size];

  const filteredOptions = searchable
    ? options.filter(
        (option) =>
          String(option.label).toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(option.value).toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  useEffect(() => {
    if (isOpen && selectRef.current) {
      setSelectRect(selectRef.current.getBoundingClientRect());

      const rect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (dropdownPosition === 'auto') {
        setDropdownDirection(spaceBelow >= 240 || spaceBelow >= spaceAbove ? 'down' : 'up');
      } else {
        setDropdownDirection(dropdownPosition);
      }
    }

    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, dropdownPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-select-dropdown]')
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && selectRef.current) {
        setSelectRect(selectRef.current.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const getContainerStyles = () => {
    const baseStyles = 'relative transition-all duration-200';

    if (disabled) {
      return `${baseStyles} opacity-60 cursor-not-allowed`;
    }

    return baseStyles;
  };

  const getTriggerStyles = () => {
    const base = `
      w-full rounded-lg transition-all duration-200
      border focus:outline-none focus:ring-2 focus:ring-offset-2
      flex items-center justify-between
      ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      ${Icon ? 'pl-10' : 'pl-4'}
      pr-4
      ${currentSize.select}
    `;

    if (error) {
      return `${base} bg-white dark:bg-theme-bg-secondary text-gray-900 dark:text-white border-red-500 focus:ring-red-500/20 dark:focus:ring-red-500/30`;
    }
    if (success) {
      return `${base} bg-white dark:bg-theme-bg-secondary text-gray-900 dark:text-white border-green-500 focus:ring-green-500/20 dark:focus:ring-green-500/30`;
    }

    const ringColorClass = activeColor
      ? ''
      : 'focus:ring-primary-500/20 dark:focus:ring-primary-500/30';

    if (variant === 'outlined') {
      return `${base} bg-transparent text-gray-900 dark:text-white border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500 ${ringColorClass}`;
    }
    if (variant === 'filled') {
      return `${base} bg-gray-50 dark:bg-theme-bg-secondary text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 ${ringColorClass}`;
    }
    return `${base} bg-white dark:bg-theme-bg-secondary text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 ${ringColorClass}`;
  };

  const getOptionStyles = (isSelected: boolean, isDisabled: boolean) => {
    const base = `
      ${currentSize.option} transition-colors duration-150
      flex items-center gap-3 w-full text-left px-4
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-50'}
    `;

    if (isSelected) {
      const selectedBase = activeColor
        ? 'text-gray-900 dark:text-white'
        : 'bg-primary-50 dark:bg-primary-600/20 text-primary-700 dark:text-primary-300';
      return `${base} ${selectedBase}`;
    }
    return `${base} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700/80`;
  };

  const getMessageStyles = (type: 'error' | 'success') => {
    const base = 'flex items-start gap-2 px-3 py-2 rounded-lg mt-1';

    return type === 'error'
      ? `${base} text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20`
      : `${base} text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20`;
  };

  const fieldName = name || (id as Path<T>);

  const handleSelect = (optionValue: string | number) => {
    if (multiple && onChange) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
      setSearchTerm('');
    } else {
      if (onChange) {
        onChange(optionValue);
      }
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange(multiple ? [] : '');
    }
  };

  const handleTriggerClick = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'Enter' && isOpen && filteredOptions.length > 0 && !searchable) {
      handleSelect(filteredOptions[0].value);
    }
  };

  const getRGBValues = (color: string) => {
    if (!color) return '';
    if (color.startsWith('primary-')) return `var(--${color})`;
    if (color.startsWith('#')) {
      const hex =
        color.length === 4
          ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
          : color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r} ${g} ${b}`;
    }
    return color;
  };

  const activeColorRGB = activeColor ? getRGBValues(activeColor) : '';
  const isSolidActive =
    activeColor && !multiple && value !== undefined && value !== '' && value !== null;

  return (
    <>
      <div className={`${containerClassName}`} ref={selectRef} onKeyDown={handleKeyDown}>
        {(label || hint) && (
          <div>
            {label && (
              <Label
                htmlFor={id}
                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
                required={required}
                error={error}
                success={success}
                variant="default"
                align="left"
                className="mb-1"
              >
                {label}
              </Label>
            )}
            {hint && !label && (
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{hint}</span>
            )}
          </div>
        )}

        <div className={getContainerStyles()}>
          <div className="relative">
            {Icon && (
              <div
                className={`absolute top-1/2 left-3 z-10 -translate-y-1/2 ${
                  isSolidActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className={currentSize.icon}>
                  {isValidElement(Icon) ? Icon : <Icon className="h-full w-full" />}
                </div>
              </div>
            )}

            <select
              id={id}
              disabled={disabled}
              {...(register ? register(fieldName) : {})}
              className="sr-only"
              value={multiple ? undefined : value}
              onChange={(e) => {
                if (onChange && !multiple) {
                  const val = e.target.value;
                  const isNumeric = !isNaN(Number(val)) && val !== '';
                  onChange(isNumeric ? Number(val) : val);
                }
              }}
              {...props}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleTriggerClick}
              disabled={disabled || loading}
              className={` ${getTriggerStyles()} ${className} ${
                isSolidActive ? 'text-white' : isOpen && activeColor ? 'ring-2 ring-offset-2' : ''
              } `}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-labelledby={`${id}-label`}
              aria-controls={`${id}-dropdown`}
              style={
                {
                  ...(activeColor
                    ? {
                        '--active-bg-rgb': activeColorRGB,
                        '--tw-ring-color': `rgb(${activeColorRGB})`,
                        backgroundColor: isSolidActive ? `rgb(${activeColorRGB} / 0.7)` : undefined,
                        borderColor: isSolidActive
                          ? 'transparent'
                          : isOpen
                            ? `rgb(${activeColorRGB})`
                            : `rgb(${activeColorRGB} / 0.4)`,
                      }
                    : {}),
                } as React.CSSProperties
              }
            >
              <span className="truncate" id={`${id}-label`}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Loading...
                  </span>
                ) : (
                  selectedLabel
                )}
              </span>

              <div className="ml-2 flex shrink-0 items-center gap-1">
                {clearable &&
                  ((multiple && Array.isArray(value) && value.length > 0) ||
                    (!multiple && value && value !== '')) &&
                  !disabled &&
                  !loading && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={handleClear}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleClear(e as any);
                        }
                      }}
                      className={`p-1 ${
                        isSolidActive
                          ? 'hover:bg-white/10'
                          : 'hover:bg-black/10 dark:hover:bg-white/10'
                      } cursor-pointer rounded transition-colors`}
                      aria-label="Clear selection"
                    >
                      <X className="h-4 w-4" />
                    </div>
                  )}

                <ChevronDown
                  className={` ${
                    currentSize.icon
                  } shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
                    isSolidActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  } `}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>

          <DropdownPortal
            isOpen={isOpen}
            selectRect={selectRect}
            dropdownDirection={dropdownDirection}
            usePortal={usePortal}
          >
            <div
              id={`${id}-dropdown`}
              role="listbox"
              aria-labelledby={`${id}-label`}
              data-select-dropdown="true"
              className="w-full"
              style={
                {
                  ...(activeColor
                    ? {
                        '--active-bg-rgb': activeColorRGB,
                        '--tw-ring-color': `rgb(${activeColorRGB})`,
                      }
                    : {}),
                } as React.CSSProperties
              }
            >
              {searchable && (
                <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-theme-bg-secondary">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pr-2 pl-8 text-sm text-gray-900 placeholder-gray-400 focus:ring-1 focus:outline-none dark:border-neutral-700 dark:bg-theme-bg-secondary dark:text-gray-100 dark:placeholder-gray-500"
                      aria-label="Search options"
                    />
                  </div>
                </div>
              )}

              <div className="py-1">
                {filteredOptions.length === 0 ? (
                  <div
                    className={`${currentSize.option} px-4 py-3 text-center text-gray-500 dark:text-gray-400`}
                  >
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = multiple
                      ? Array.isArray(value) && value.some((v) => v === option.value)
                      : option.value === value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        disabled={option.disabled}
                        className={` ${getOptionStyles(isSelected, !!option.disabled)} ${option.disabled ? 'cursor-not-allowed' : ''} `}
                        style={
                          isSelected && activeColor
                            ? {
                                backgroundColor: `rgb(${activeColorRGB} / 0.7)`,
                              }
                            : {}
                        }
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                      >
                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                        <span className="flex-1 text-left whitespace-nowrap">{option.label}</span>
                        {isSelected && (
                          <Check
                            className={`h-4 w-4 shrink-0 ${
                              activeColor ? 'text-white' : 'text-primary-500 dark:text-primary-400'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </DropdownPortal>
        </div>

        {error && (
          <div id={`${id}-error`} className={getMessageStyles('error')} role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && !error && (
          <div id={`${id}-success`} className={getMessageStyles('success')} role="status">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}
      </div>
    </>
  );
}
