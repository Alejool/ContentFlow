import {
  CheckCircle,
  Eye,
  EyeOff,
  LucideIcon,
  TriangleAlert,
} from "lucide-react";
import { InputHTMLAttributes, ReactNode, useState } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

import Label from "@/Components/common/Modern/Label";

interface InputProps<T extends FieldValues = FieldValues> extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "prefix"
> {
  id: string;
  label?: string;
  error?: string;
  success?: string;
  register?: UseFormRegister<T>;
  name?: Path<T>;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  icon?: LucideIcon;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  variant?: "default" | "outlined" | "filled";
  sizeType?: "sm" | "md" | "lg";
  required?: boolean;
  activeColor?: string;
}

export default function Input<T extends FieldValues>({
  id,
  label,
  type = "text",
  error,
  success,
  register,
  name,
  placeholder,
  showPasswordToggle = false,
  disabled = false,
  className = "",
  containerClassName = "",
  icon: Icon,
  hint,
  prefix,
  suffix,
  variant = "default",
  sizeType = "md",
  required = false,
  activeColor,
  ...props
}: InputProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;
  const fieldName = name || (id as Path<T>);
  const {
    onChange: propOnChange,
    value: propValue,
    name: propName,
    ...restProps
  } = props as any;

  const sizeConfig = {
    sm: { input: "py-1 px-2 text-xs", icon: "w-3 h-3", label: "text-xs" },
    md: { input: "py-2 px-3 text-sm", icon: "w-4 h-4", label: "text-sm" },
    lg: { input: "py-3 px-4 text-base", icon: "w-5 h-5", label: "text-base" },
  };

  const currentSize = sizeConfig[sizeType];

  const getContainerStyles = () => {
    const baseStyles = "relative transition-all duration-200";

    if (disabled) {
      return `${baseStyles} opacity-60 cursor-not-allowed`;
    }

    if (error) {
      return `${baseStyles} dark:animate-pulse`;
    }

    return baseStyles;
  };

  const getInputStyles = () => {
    const base = `
      block w-full rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${disabled ? "cursor-not-allowed opacity-60" : ""}
      ${prefix ? "pl-24" : Icon ? "pl-10" : "pl-4"}
      ${suffix || showPasswordToggle ? "pr-10" : "pr-4"}
      ${currentSize.input}
    `;

    if (error) {
      return `${base} border-primary-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-primary-500/20 dark:focus:ring-primary-500/30`;
    }
    if (success) {
      return `${base} border-green-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-green-500/20 dark:focus:ring-green-500/30`;
    }
    if (variant === "outlined") {
      return `${base} bg-transparent border-2 border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500 text-gray-900 dark:text-white focus:ring-primary-500/20 dark:focus:ring-primary-500/30`;
    }
    if (variant === "filled") {
      return `${base} bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700/80 text-gray-900 dark:text-white focus:ring-primary-500/20 dark:focus:ring-primary-500/30`;
    }
    return `${base} bg-white dark:bg-neutral-800/50 border border-gray-300 dark:border-neutral-700/50 hover:border-gray-400 dark:hover:border-neutral-600/70 text-gray-900 dark:text-white focus:ring-primary-500/20 dark:focus:ring-primary-500/30`;
  };

  const getMessageStyles = (type: "error" | "success") => {
    return type === "error"
      ? "flex items-start align-center gap-2 py-2 rounded-lg text-sm text-primary-600"
      : "flex items-start align-center gap-2 py-2 rounded-lg text-sm text-green-600";
  };

  return (
    <div className={`${containerClassName}`}>
      {(label || hint) && (
        <div>
          {label && (
            <Label
              htmlFor={id}
              size={sizeType === "md" ? "md" : sizeType === "lg" ? "lg" : "sm"}
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
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {hint}
            </span>
          )}
        </div>
      )}

      <div className={getContainerStyles()}>
        {(Icon || prefix) && (
          <div
            className={`
            absolute left-3 top-1/2 -translate-y-1/2 flex items-center
            ${
              error
                ? "text-primary-500 dark:text-primary-400"
                : success
                  ? "text-green-500 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-400"
            }
          `}
          >
            {Icon && (
              <Icon className={`${currentSize.icon} ${prefix ? "mr-2" : ""}`} />
            )}
            {prefix}
          </div>
        )}

        <input
          id={id}
          type={inputType}
          disabled={disabled}
          {...(!register ? { name: propName ?? fieldName } : {})}
          {...(register ? register(fieldName) : {})}
          placeholder={placeholder}
          className={`${getInputStyles()} ${className}`}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={
            {
              ...(activeColor
                ? {
                    "--tw-ring-color": activeColor,
                    borderColor: isFocused ? activeColor : `${activeColor}40`,
                  }
                : {}),
              ...props.style,
            } as React.CSSProperties
          }
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : success ? `${id}-success` : undefined
          }
          {...(propValue !== undefined ? { value: propValue } : {})}
          {...(propOnChange !== undefined ? { onChange: propOnChange } : {})}
          {...restProps}
        />

        {(suffix || showPasswordToggle || error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {suffix}

            {showPasswordToggle && !disabled && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="transition-colors rounded-lg p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700/50"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className={currentSize.icon} />
                ) : (
                  <Eye className={currentSize.icon} />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className={getMessageStyles("error")} role="alert">
          <TriangleAlert className={`${currentSize.icon}  flex-shrink-0`} />
          <span>{error}</span>
        </div>
      )}

      {success && !error && (
        <div className={getMessageStyles("success")} role="status">
          <CheckCircle className={`${currentSize.icon}  flex-shrink-0`} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
