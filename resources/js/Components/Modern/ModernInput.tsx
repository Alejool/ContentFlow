import { useTheme } from "@/Hooks/useTheme";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  LucideIcon,
} from "lucide-react";
import { InputHTMLAttributes, ReactNode, useState } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

interface ModernInputProps<T extends FieldValues = FieldValues>
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
}

export default function ModernInput<T extends FieldValues>({
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
  ...props
}: ModernInputProps<T>) {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === "password" && showPassword ? "text" : type;

  const fieldName = name || (id as Path<T>);

  const getContainerStyles = () => {
    const baseStyles = "relative transition-all duration-200";

    if (disabled) {
      return `${baseStyles} opacity-60 cursor-not-allowed`;
    }

    if (error) {
      return `${baseStyles} animate-pulse`;
    }

    return baseStyles;
  };

  const getInputStyles = () => {
    const baseStyles = ` pl-10
      block w-full text-sm placeholder:text-sm
      rounded-lg transition-all duration-200
      focus:outline-none focus:ring-0 focus:ring-offset-0
      ${disabled ? "cursor-not-allowed" : ""}
      ${prefix ? "pl-12" : "pl-4"}
      ${suffix || showPasswordToggle ? "pr-12" : "pr-4"}
      ${Icon ? "pl-[40px]" : ""}
    `;

    if (theme === "dark") {
      switch (variant) {
        case "filled":
          return `
            ${baseStyles}
            py-3.5
            bg-neutral-800/50 text-white placeholder:text-gray-400
            border border-neutral-700/50
            ${
              error
                ? "border-primary-500/50 bg-primary-900/10 focus:border-primary-500"
                : success
                ? "border-green-500/50 bg-green-900/10 focus:border-green-500"
                : isFocused
                ? "border-purple-500/50 bg-neutral-800/70"
                : "hover:border-neutral-600/70 hover:bg-neutral-800/60"
            }
          `;

        case "outlined":
          return `
            ${baseStyles}
            py-3
            bg-transparent text-white placeholder:text-gray-500
            border-2
            ${
              error
                ? "border-primary-500/50 focus:border-primary-500"
                : success
                ? "border-green-500/50 focus:border-green-500"
                : isFocused
                ? "border-purple-500"
                : "border-neutral-700 hover:border-neutral-600"
            }
          `;

        default:
          return `
            ${baseStyles}
            py-3
            bg-neutral-900/30 text-white placeholder:text-gray-400
            border border-neutral-700/50
            shadow-sm
            ${
              error
                ? "border-primary-500/50 bg-primary-900/10 focus:border-primary-500"
                : success
                ? "border-green-500/50 bg-green-900/10 focus:border-green-500"
                : isFocused
                ? "border-purple-500 bg-neutral-800/50 shadow-md"
                : "hover:border-neutral-600 hover:bg-neutral-800/40 hover:shadow"
            }
          `;
      }
    } else {
      switch (variant) {
        case "filled":
          return `
            ${baseStyles}
            py-3.5
            bg-gray-50 text-gray-900 placeholder:text-gray-500
            border border-gray-200
            ${
              error
                ? "border-primary-300 bg-primary-50 focus:border-primary-500"
                : success
                ? "border-green-300 bg-green-50 focus:border-green-500"
                : isFocused
                ? "border-purple-500 bg-white"
                : "hover:border-gray-300 hover:bg-white"
            }
          `;

        case "outlined":
          return `
            ${baseStyles}
            py-3
            bg-transparent text-gray-900 placeholder:text-gray-500
            border-2
            ${
              error
                ? "border-primary-300 focus:border-primary-500"
                : success
                ? "border-green-300 focus:border-green-500"
                : isFocused
                ? "border-purple-500"
                : "border-gray-300 hover:border-gray-400"
            }
          `;

        default:
          return `
            ${baseStyles}
            py-3
            bg-white text-gray-900 placeholder:text-gray-400
            border-2 border-gray-200
            shadow-sm
            ${
              error
                ? "border-primary-300 bg-primary-50 focus:border-primary-500"
                : success
                ? "border-green-300 bg-green-50 focus:border-green-500"
                : isFocused
                ? "border-purple-500 bg-gray-50 shadow-md"
                : "hover:border-gray-300 hover:shadow"
            }
          `;
      }
    }
  };

  const getLabelStyles = () => {
    if (theme === "dark") {
      return `block text-sm font-medium mb-2 ${
        error
          ? "text-primary-400"
          : success
          ? "text-green-400"
          : "text-gray-300"
      }`;
    }
    return `block text-sm font-medium mb-2 ${
      error ? "text-primary-600" : success ? "text-green-600" : "text-gray-700"
    }`;
  };

  const getErrorStyles = () => {
    if (theme === "dark") {
      return "text-primary-400 bg-primary-900/20 border border-primary-800/30";
    }
    return "text-primary-600 bg-primary-50 border border-primary-100";
  };

  const getSuccessStyles = () => {
    if (theme === "dark") {
      return "text-green-400 bg-green-900/20 border border-green-800/30";
    }
    return "text-green-600 bg-green-50 border border-green-100";
  };

  const getHintStyles = () => {
    if (theme === "dark") {
      return "text-gray-400";
    }
    return "text-gray-500";
  };

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className={getLabelStyles()}>
            {label}
          </label>
          {hint && <span className={`text-xs ${getHintStyles()}`}>{hint}</span>}
        </div>
      )}

      <div className={getContainerStyles()}>
        {Icon && (
          <div
            className={`
            absolute left-4 top-1/2 -translate-y-1/2
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
            <Icon className="w-5 h-5" />
          </div>
        )}

        {prefix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
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
          {...props}
        />

        {(error || success) && !suffix && !showPasswordToggle && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {error ? (
              <AlertCircle className="w-5 h-5 text-primary-500" />
            ) : success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
        )}

        {suffix && !showPasswordToggle && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}

        {showPasswordToggle && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`
              absolute right-4 top-1/2 -translate-y-1/2
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
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <div
          className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${getErrorStyles()}`}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && !error && (
        <div
          className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${getSuccessStyles()}`}
        >
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
