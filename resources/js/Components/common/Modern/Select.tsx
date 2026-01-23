import Label from "@/Components/common/Modern/Label";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  LucideIcon,
  Search,
  X,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

interface DropdownPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  selectRect: DOMRect | null;
  dropdownDirection: "up" | "down";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (usePortal && isOpen && selectRect && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const viewportHeight = window.innerHeight;
      const dropdownHeight = Math.min(dropdown.scrollHeight, 240);

      dropdown.style.minWidth = `${selectRect.width}px`;
      dropdown.style.width = "auto";
      dropdown.style.left = `${selectRect.left}px`;

      if (dropdownDirection === "up") {
        const topPosition = selectRect.top - dropdownHeight - 4;
        if (topPosition > 0) {
          dropdown.style.top = `${topPosition}px`;
          dropdown.style.bottom = "auto";
        } else {
          dropdown.style.top = `${selectRect.bottom + 4}px`;
          dropdown.style.bottom = "auto";
        }
      } else {
        const bottomPosition =
          viewportHeight - (selectRect.bottom + 4 + dropdownHeight);
        if (bottomPosition > 0) {
          dropdown.style.top = `${selectRect.bottom + 4}px`;
          dropdown.style.bottom = "auto";
        } else {
          dropdown.style.top = `${selectRect.top - dropdownHeight - 4}px`;
          dropdown.style.bottom = "auto";
        }
      }
    }
  }, [isOpen, selectRect, dropdownDirection, usePortal]);

  if (!isOpen || (usePortal && (!mounted || !selectRect))) return null;

  const portalStyles: React.CSSProperties = {
    position: usePortal ? "fixed" : "absolute",
    zIndex: 9999,
    maxHeight: "240px",
    width: "100%",
    minWidth: "120px",
    overflowY: "auto",
    transition: "opacity 150ms ease-out, transform 150ms ease-out",
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "scale(1)" : "scale(0.95)",
    transformOrigin:
      dropdownDirection === "up" ? "bottom center" : "top center",
    borderRadius: "0.5rem",
    borderWidth: "1px",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  };

  const content = (
    <div
      ref={dropdownRef}
      style={portalStyles}
      className={`bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 ${
        !usePortal
          ? dropdownDirection === "up"
            ? "bottom-full left-0 mb-1"
            : "top-full left-0 mt-1"
          : ""
      }`}
    >
      {children}
    </div>
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
  label?: string;
  error?: string;
  success?: string;
  register?: UseFormRegister<T>;
  name?: Path<T>;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  icon?: LucideIcon;
  hint?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  required?: boolean;
  value?: string | number;
  onChange?: (value: string | number) => void;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  dropdownPosition?: "down" | "up" | "auto";
  usePortal?: boolean;
}

export default function Select<T extends FieldValues>({
  id,
  label,
  error,
  success,
  register,
  name,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  containerClassName = "",
  icon: Icon,
  hint,
  size = "md",
  variant = "default",
  required = false,
  value,
  onChange,
  searchable = false,
  clearable = false,
  loading = false,
  dropdownPosition = "auto",
  usePortal = true,
  ...props
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [dropdownDirection, setDropdownDirection] = useState<"down" | "up">(
    dropdownPosition === "auto" ? "down" : dropdownPosition,
  );
  const [selectRect, setSelectRect] = useState<DOMRect | null>(null);

  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = {
    sm: {
      select: "py-1 px-2 text-sm",
      icon: "w-4 h-4",
      label: "text-xs",
      option: "py-2 px-3 text-sm",
      search: "py-2 px-3 text-sm",
    },
    md: {
      select: "py-2 px-3 text-base",
      icon: "w-5 h-5",
      label: "text-sm",
      option: "py-2.5 px-4 text-base",
      search: "py-2.5 px-4 text-base",
    },
    lg: {
      select: "py-3 px-4 text-lg",
      icon: "w-6 h-6",
      label: "text-base",
      option: "py-2 px-3 text-lg",
      search: "py-2 px-3 text-lg",
    },
  };

  const currentSize = sizeConfig[size];

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      const selected = options.find((option) => option.value === value);
      setSelectedLabel(selected?.label || placeholder);
    } else {
      setSelectedLabel(placeholder);
    }
  }, [value, options, placeholder]);

  useEffect(() => {
    if (isOpen && selectRef.current) {
      setSelectRect(selectRef.current.getBoundingClientRect());

      const rect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (dropdownPosition === "auto") {
        setDropdownDirection(
          spaceBelow >= 240 || spaceBelow >= spaceAbove ? "down" : "up",
        );
      } else {
        setDropdownDirection(dropdownPosition);
      }
    }

    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, dropdownPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest("[data-select-dropdown]")
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
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

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const getContainerStyles = () => {
    const baseStyles = "relative transition-all duration-200";

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
      ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
      ${Icon ? "pl-10" : "pl-4"}
      pr-4
      ${currentSize.select}
    `;

    if (error) {
      return `${base} bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border-primary-500 focus:ring-primary-500/20 dark:focus:ring-primary-500/30`;
    }
    if (success) {
      return `${base} bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border-green-500 focus:ring-green-500/20 dark:focus:ring-green-500/30`;
    }
    if (variant === "outlined") {
      return `${base} bg-transparent text-gray-900 dark:text-white border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500 focus:ring-purple-500/20 dark:focus:ring-purple-500/30`;
    }
    if (variant === "filled") {
      return `${base} bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 focus:ring-purple-500/20 dark:focus:ring-purple-500/30`;
    }
    return `${base} bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 focus:ring-purple-500/20 dark:focus:ring-purple-500/30`;
  };

  const getOptionStyles = (isSelected: boolean, isDisabled: boolean) => {
    const base = `
      ${currentSize.option} transition-colors duration-150
      flex items-center gap-3 w-full text-left px-4
      ${
        isDisabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-opacity-50"
      }
    `;

    if (isSelected) {
      return `${base} bg-purple-50 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300`;
    }
    return `${base} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700/80`;
  };

  const getSearchInputStyles = () => {
    const base = `
      w-full px-4 py-3 focus:outline-none bg-transparent
      ${currentSize.search}
    `;

    return `${base} text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-b border-gray-200 dark:border-neutral-700 focus:border-purple-500`;
  };

  const getMessageStyles = (type: "error" | "success") => {
    const base = "flex items-start gap-2 px-3 py-2 rounded-lg mt-1";

    return type === "error"
      ? `${base} text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30`
      : `${base} text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/30`;
  };

  const fieldName = name || (id as Path<T>);

  const handleSelect = (optionValue: string | number) => {
    if (onChange) {
      onChange(optionValue);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange("");
    }
    setSelectedLabel(placeholder);
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
    if (e.key === "Escape") {
      setIsOpen(false);
    }
    if (
      e.key === "Enter" &&
      isOpen &&
      filteredOptions.length > 0 &&
      !searchable
    ) {
      handleSelect(filteredOptions[0].value);
    }
  };

  return (
    <>
      <div
        className={`${containerClassName}`}
        ref={selectRef}
        onKeyDown={handleKeyDown}
      >
        {(label || hint) && (
          <div>
            {label && (
              <Label
                htmlFor={id}
                size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
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
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                {hint}
              </span>
            )}
          </div>
        )}

        <div className={getContainerStyles()}>
          <div className="relative">
            {Icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-500 dark:text-gray-400">
                <Icon className={currentSize.icon} />
              </div>
            )}

            <select
              id={id}
              disabled={disabled}
              {...(register ? register(fieldName) : {})}
              className="sr-only"
              value={value}
              onChange={(e) => {
                if (onChange) {
                  const val = e.target.value;
                  const isNumeric = !isNaN(Number(val)) && val !== "";
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
              className={`${getTriggerStyles()} ${className}`}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-labelledby={`${id}-label`}
              aria-controls={`${id}-dropdown`}
            >
              <span className="truncate" id={`${id}-label`}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4"></span>
                    Loading...
                  </span>
                ) : (
                  selectedLabel
                )}
              </span>

              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                {clearable &&
                  value &&
                  value !== "" &&
                  !disabled &&
                  !loading && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                      aria-label="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                <ChevronDown
                  className={`
                    ${
                      currentSize.icon
                    } transition-transform duration-200 flex-shrink-0
                    ${isOpen ? "rotate-180" : ""}
                    text-gray-500 dark:text-gray-400
                  `}
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
            >
              {searchable && (
                <div className="sticky top-0 bg-inherit border-b border-inherit">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={getSearchInputStyles()}
                      style={{ paddingLeft: "2.5rem" }}
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
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          !option.disabled && handleSelect(option.value)
                        }
                        disabled={option.disabled}
                        className={`${getOptionStyles(
                          isSelected,
                          !!option.disabled,
                        )} ${option.disabled ? "cursor-not-allowed" : ""}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                      >
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}
                        <span className="flex-1 text-left whitespace-nowrap">
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 flex-shrink-0 text-purple-500 dark:text-purple-400" />
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
          <div
            id={`${id}-error`}
            className={getMessageStyles("error")}
            role="alert"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && !error && (
          <div
            id={`${id}-success`}
            className={getMessageStyles("success")}
            role="status"
          >
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}
      </div>
    </>
  );
}
