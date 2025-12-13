import { useTheme } from "@/Hooks/useTheme";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Search,
  X,
  LucideIcon,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";
import Label from "@/Components/common/Modern/Label";

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
  theme?: "dark" | "light";
  hint?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  required?: boolean;
  value?: string | number;
  onChange?: (value: string | number) => void;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  dropdownPosition?: "down" | "up"; // Nueva prop
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
  theme: propTheme,
  hint,
  size = "md",
  variant = "default",
  required = false,
  value,
  onChange,
  searchable = false,
  clearable = false,
  loading = false,
  dropdownPosition = "up", 
  ...props
}: SelectProps<T>) {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [dropdownDirection, setDropdownDirection] = useState<"down" | "up">(
    "down"
  );
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      select: "py-2 px-3 text-sm",
      icon: "w-4 h-4",
      label: "text-sm",
      option: "py-2 px-3 text-sm",
    },
    md: {
      select: "py-3 px-4 text-base",
      icon: "w-5 h-5",
      label: "text-base",
      option: "py-2.5 px-4 text-base",
    },
    lg: {
      select: "py-4 px-4 text-lg",
      icon: "w-6 h-6",
      label: "text-lg",
      option: "py-3 px-4 text-lg",
    },
  };

  const currentSize = sizeConfig[size];

  // Filtrar opciones basadas en búsqueda
  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Encontrar la etiqueta seleccionada
  useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      const selected = options.find((option) => option.value === value);
      setSelectedLabel(selected?.label || placeholder);
    } else {
      setSelectedLabel(placeholder);
    }
  }, [value, options, placeholder]);

  // Calcular posición del dropdown basado en espacio disponible
  useEffect(() => {
    const calculateDropdownPosition = () => {
      if (!selectRef.current || !isOpen) return;

      const selectRect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - selectRect.bottom;
      const spaceAbove = selectRect.top;
      const dropdownHeight = 250; // Altura aproximada del dropdown

      // Si la prop dropdownPosition es "auto", decidir automáticamente
      // Si es "down" o "up", usar la dirección especificada
      let direction: "down" | "up";

      if (dropdownPosition === "down") {
        direction = "down";
      } else if (dropdownPosition === "up") {
        direction = "up";
      } else {
        // Auto: decidir basado en espacio disponible
        direction =
          spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove
            ? "down"
            : "up";
      }

      setDropdownDirection(direction);
    };

    if (isOpen) {
      calculateDropdownPosition();
      window.addEventListener("resize", calculateDropdownPosition);
      window.addEventListener("scroll", calculateDropdownPosition, true);
    }

    return () => {
      window.removeEventListener("resize", calculateDropdownPosition);
      window.removeEventListener("scroll", calculateDropdownPosition, true);
    };
  }, [isOpen, dropdownPosition]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enfocar input de búsqueda cuando se abre
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

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

    if (theme === "dark") {
      if (error) {
        return `${base} bg-neutral-800 text-white border-primary-500 focus:ring-primary-500/30`;
      }
      if (success) {
        return `${base} bg-neutral-800 text-white border-green-500 focus:ring-green-500/30`;
      }
      if (variant === "outlined") {
        return `${base} bg-transparent text-white border-neutral-600 hover:border-neutral-500 focus:ring-purple-500/30`;
      }
      if (variant === "filled") {
        return `${base} bg-neutral-800 text-white border-neutral-700 hover:border-neutral-600 focus:ring-purple-500/30`;
      }
      return `${base} bg-neutral-900 text-white border-neutral-700 hover:border-neutral-600 focus:ring-purple-500/30`;
    } else {
      if (error) {
        return `${base} bg-white text-gray-900 border-primary-500 focus:ring-primary-500/20`;
      }
      if (success) {
        return `${base} bg-white text-gray-900 border-green-500 focus:ring-green-500/20`;
      }
      if (variant === "outlined") {
        return `${base} bg-transparent text-gray-900 border-gray-300 hover:border-gray-400 focus:ring-purple-500/20`;
      }
      if (variant === "filled") {
        return `${base} bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400 focus:ring-purple-500/20`;
      }
      return `${base} bg-white text-gray-900 border-gray-300 hover:border-gray-400 focus:ring-purple-500/20`;
    }
  };

  const getDropdownStyles = () => {
    const base = `
      absolute z-50 w-full rounded-lg shadow-2xl overflow-hidden
      transition-all duration-200 ease-out origin-top
      border max-h-60
      ${
        isOpen
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }
    `;

    // Posicionamiento basado en la dirección
    const positionStyles =
      dropdownDirection === "up"
        ? `bottom-full mb-1 translate-y-0 ${isOpen ? "" : "translate-y-2"}`
        : `top-full mt-1 translate-y-0 ${isOpen ? "" : "-translate-y-2"}`;

    if (theme === "dark") {
      return `${base} ${positionStyles} bg-neutral-800 border-neutral-700`;
    }
    return `${base} ${positionStyles} bg-white border-gray-200`;
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

    if (theme === "dark") {
      if (isSelected) {
        return `${base} bg-purple-600/20 text-purple-300`;
      }
      return `${base} text-gray-300 hover:bg-neutral-700/80`;
    } else {
      if (isSelected) {
        return `${base} bg-purple-50 text-purple-700`;
      }
      return `${base} text-gray-700 hover:bg-gray-100`;
    }
  };

  const getMessageStyles = (type: "error" | "success") => {
    const base = "flex items-start gap-2 px-3 py-2 rounded-lg";

    if (theme === "dark") {
      return type === "error"
        ? `${base} text-primary-300 bg-primary-900/30`
        : `${base} text-green-300 bg-green-900/30`;
    }
    return type === "error"
      ? `${base} text-primary-600 bg-primary-50`
      : `${base} text-green-600 bg-green-50`;
  };

  const getHintStyles = () => {
    return theme === "dark" ? "text-gray-400 text-sm" : "text-gray-500 text-sm";
  };

  const getSearchInputStyles = () => {
    const base = `
      w-full px-4 py-3 focus:outline-none bg-transparent
      ${currentSize.option}
    `;

    if (theme === "dark") {
      return `${base} text-white placeholder-gray-500 border-b border-neutral-700`;
    }
    return `${base} text-gray-900 placeholder-gray-400 border-b border-gray-200`;
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

  return (
    <div className={`space-y-2 ${containerClassName}`} ref={selectRef}>
      {/* Header con label y hint */}
      {(label || hint) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label
              htmlFor={id}
              size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
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
            <span
              className={`text-xs ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              } ml-auto`}
            >
              {hint}
            </span>
          )}
        </div>
      )}

      <div className={getContainerStyles()}>
        {/* Campo de selección principal */}
        <div className="relative">
          {Icon && (
            <div
              className={`
              absolute left-3 top-1/2 -translate-y-1/2 z-10
              ${theme === "dark" ? "text-gray-400" : "text-gray-500"}
            `}
            >
              <Icon className={currentSize.icon} />
            </div>
          )}

          {/* Input oculto para react-hook-form */}
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

          {/* Botón trigger personalizado */}
          <button
            type="button"
            onClick={handleTriggerClick}
            disabled={disabled || loading}
            className={`${getTriggerStyles()} ${className}`}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4"></span>
                  Loading...
                </span>
              ) : (
                selectedLabel
              )}
            </span>

            <div className="flex items-center gap-1 ml-2">
              {clearable && value && value !== "" && !disabled && (
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
                  ${currentSize.icon} transition-transform duration-200
                  ${isOpen ? "rotate-180" : ""}
                  ${theme === "dark" ? "text-gray-400" : "text-gray-500"}
                `}
              />
            </div>
          </button>

          {/* Dropdown con opciones */}
          <div className={getDropdownStyles()} ref={dropdownRef}>
            {searchable && (
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={getSearchInputStyles()}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            )}

            <div
              className="overflow-y-auto py-1"
              style={{ maxHeight: "240px" }}
            >
              {filteredOptions.length === 0 ? (
                <div
                  className={`${currentSize.option} px-4 py-3 text-center ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
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
                      className={getOptionStyles(isSelected, !!option.disabled)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {option.icon && (
                        <span className="flex-shrink-0">{option.icon}</span>
                      )}
                      <span className="flex-1">{option.label}</span>
                      {isSelected && (
                        <svg
                          className={`w-4 h-4 ${
                            theme === "dark"
                              ? "text-purple-400"
                              : "text-purple-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
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
  );
}
