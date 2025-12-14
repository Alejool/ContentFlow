import { useTheme } from "@/Hooks/useTheme";
import {
  TriangleAlert,
  CheckCircle,
  Eye,
  EyeOff,
  LucideIcon,
} from "lucide-react";
import { InputHTMLAttributes, ReactNode, useState } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

import Label from "@/Components/common/Modern/Label";

interface InputProps<T extends FieldValues = FieldValues>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "prefix"> {
  id: string;
  label?: string;
  error?: string;
  success?: string;
  register?: UseFormRegister<T>;
  name?: Path<T>;
  showPasswordToggle?: boolean;
  containerClassName?: string;
  icon?: LucideIcon;
  theme?: "dark" | "light";
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  variant?: "default" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  required?: boolean;
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
  theme: propTheme,
  hint,
  prefix,
  suffix,
  variant = "default",
  size = "md",
  required = false,
  ...props
}: InputProps<T>) {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;
  const fieldName = name || (id as Path<T>);

  // Configuración de tamaños
  const sizeConfig = {
    sm: { input: "py-1 px-2 text-xs", icon: "w-3 h-3", label: "text-xs" },
    md: { input: "py-2 px-3 text-sm", icon: "w-4 h-4", label: "text-sm" },
    lg: { input: "py-3 px-4 text-base", icon: "w-5 h-5", label: "text-base" },
  };

  const currentSize = sizeConfig[size];

  const getContainerStyles = () => {
    const baseStyles = "relative transition-all duration-200";

    if (disabled) {
      return `${baseStyles} opacity-60 cursor-not-allowed`;
    }

    if (error) {
      return `${baseStyles} ${theme === "dark" ? "animate-pulse" : ""}`;
    }

    return baseStyles;
  };

  const getInputStyles = () => {
    const baseStyles = `
      block w-full rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${disabled ? "cursor-not-allowed" : ""}
      ${prefix ? "pl-10" : Icon ? "pl-10" : "pl-4"}
      ${suffix || showPasswordToggle ? "pr-10" : "pr-4"}
      ${currentSize.input}
    `;

  
    const styles = {
      dark: {
        default: {
          base: "bg-neutral-800/50 text-white border border-neutral-700/50",
          states: {
            error:
              "border-primary-400  focus:ring-primary-500/30 focus:border-primary-400",
            success:
              "border-green-400  focus:ring-green-500/30 focus:border-green-400",
            focused:
              "border-purple-400 focus:ring-purple-500/30",
            idle: "hover:border-neutral-600/70 hover:bg-neutral-800/60 focus:ring-purple-500/30",
          },
        },
        outlined: {
          base: "bg-transparent text-white border-2",
          states: {
            error: "border-primary-400 focus:ring-primary-500/30",
            success: "border-green-400 focus:ring-green-500/30",
            focused: "border-purple-400 focus:ring-purple-500/30",
            idle: "border-neutral-700 hover:border-neutral-600 focus:ring-purple-500/30",
          },
        },
        filled: {
          base: "bg-neutral-800 text-white border border-neutral-700",
          states: {
            error:
              "border-primary-400 focus:ring-primary-500/30",
            success: "border-green-400 focus:ring-green-500/30",
            focused:
              "border-purple-400 focus:ring-purple-500/30",
            idle: "hover:bg-neutral-700/80 focus:ring-purple-500/30",
          },
        },
      },
      light: {
        default: {
          base: "bg-white text-gray-900 border border-gray-300",
          states: {
            error:
              "border-primary-500 focus:ring-primary-500/20 focus:border-primary-500",
            success:
              "border-green-500 focus:ring-green-500/20 focus:border-green-500",
            focused: "border-purple-500 focus:ring-purple-500/20",
            idle: "hover:border-gray-400 focus:ring-purple-500/20",
          },
        },
        outlined: {
          base: "bg-transparent text-gray-900 border-2",
          states: {
            error: "border-primary-500 focus:ring-primary-500/20",
            success: "border-green-500 focus:ring-green-500/20",
            focused: "border-purple-500 focus:ring-purple-500/20",
            idle: "border-gray-300 hover:border-gray-400 focus:ring-purple-500/20",
          },
        },
        filled: {
          base: "bg-gray-50 text-gray-900 border border-gray-300",
          states: {
            error: "border-primary-500 focus:ring-primary-500/20",
            success: "border-green-500 focus:ring-green-500/20",
            focused: "border-purple-500 focus:ring-purple-500/20",
            idle: "hover:bg-white focus:ring-purple-500/20",
          },
        },
      },
    };

    const themeStyles = styles[theme as keyof typeof styles];
    const variantStyles = themeStyles[variant as keyof typeof themeStyles];

    let stateStyles = variantStyles.states.idle;
    if (error) stateStyles = variantStyles.states.error;
    else if (success) stateStyles = variantStyles.states.success;
    else if (isFocused) stateStyles = variantStyles.states.focused;

    return `${baseStyles} ${variantStyles.base} ${stateStyles}`;
  };

  const getMessageStyles = (type: "error" | "success") => {
    const base = "flex items-start align-center gap-2  py-2 rounded-lg text-sm";

    if (theme === "dark") {
      return type === "error"
        ? `${base} text-primary-600 `
        : `${base} text-green-600`;
    }
    return type === "error"
      ? `${base} text-primary-600`
      : `${base} text-green-600`;
  };

  return (
    <div className={` ${containerClassName}`}>
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
        {(Icon || prefix) && (
          <div
            className={`
            absolute left-3 top-1/2 -translate-y-1/2 flex items-center
            ${
              theme === "dark"
                ? error
                  ? "text-primary-400"
                  : success
                  ? "text-green-400"
                  : "text-gray-400"
                : error
                ? "text-primary-500"
                : success
                ? "text-green-500"
                : "text-gray-400"
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
          {...(register ? register(fieldName) : {})}
          placeholder={placeholder}
          className={`${getInputStyles()} ${className}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : success ? `${id}-success` : undefined
          }
          {...props}
        />

        {(suffix || showPasswordToggle || error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {suffix}

           

            {showPasswordToggle && !disabled && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`
                  transition-colors rounded-lg p-1
                  ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-gray-300 hover:bg-neutral-700/50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }
                `}
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
