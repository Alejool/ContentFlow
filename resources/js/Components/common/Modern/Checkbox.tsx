import { useTheme } from "@/Hooks/useTheme";
import { AlertCircle, Check, CheckCircle, LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

interface CheckboxProps<T extends FieldValues = FieldValues> {
  id: string;
  label?: string | ReactNode;
  error?: string;
  success?: string;
  register?: UseFormRegister<T>;
  name?: Path<T>;
  checked?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  icon?: LucideIcon;
  theme?: "dark" | "light";
  hint?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  required?: boolean;
  onChange?: (checked: boolean) => void;
  value?: string | number | boolean;
  description?: string;
}

export default function Checkbox<T extends FieldValues>({
  id,
  label,
  error,
  success,
  register,
  name,
  checked,
  disabled = false,
  className = "",
  containerClassName = "",
  icon: Icon,
  theme: propTheme,
  hint,
  size = "md",
  variant = "default",
  required = false,
  onChange,
  value,
  description,
  ...props
}: CheckboxProps<T>) {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;

  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      checkbox: "w-4 h-4",
      icon: "w-3 h-3",
      label: "text-xs",
      description: "text-xs",
    },
    md: {
      checkbox: "w-5 h-5",
      icon: "w-4 h-4",
      label: "text-sm",
      description: "text-xs",
    },
    lg: {
      checkbox: "w-6 h-6",
      icon: "w-5 h-5",
      label: "text-base",
      description: "text-sm",
    },
  };

  const currentSize = sizeConfig[size];

  const getContainerStyles = () => {
    const baseStyles = "flex items-start gap-3 transition-all duration-200";

    if (disabled) {
      return `${baseStyles} opacity-60 cursor-not-allowed`;
    }

    if (error) {
      return `${baseStyles} ${theme === "dark" ? "animate-pulse" : ""}`;
    }

    return baseStyles;
  };

  const getCheckboxStyles = () => {
    const baseStyles = `
      rounded transition-all duration-200 flex items-center justify-center
      border-2 focus:outline-none focus:ring-2 focus:ring-offset-2
      ${currentSize.checkbox}
    `;

    if (theme === "dark") {
      switch (variant) {
        case "filled":
          return `
            ${baseStyles}
            ${
              checked
                ? "bg-primary-500 border-primary-500"
                : "bg-neutral-800 border-neutral-600 hover:border-neutral-500"
            }
            focus:ring-primary-500/30
          `;

        case "outlined":
          return `
            ${baseStyles}
            bg-transparent
            ${
              checked
                ? "border-primary-500 bg-primary-500/10"
                : "border-neutral-600 hover:border-neutral-500"
            }
            focus:ring-primary-500/30
          `;

        default:
          return `
            ${baseStyles}
            ${
              checked
                ? "bg-primary-500 border-primary-500"
                : "bg-neutral-800/50 border-neutral-600 hover:border-neutral-500"
            }
            focus:ring-primary-500/30
          `;
      }
    } else {
      switch (variant) {
        case "filled":
          return `
            ${baseStyles}
            ${
              checked
                ? "bg-primary-500 border-primary-500"
                : "bg-gray-100 border-gray-300 hover:border-gray-400"
            }
            focus:ring-primary-500/20
          `;

        case "outlined":
          return `
            ${baseStyles}
            bg-transparent
            ${
              checked
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:border-gray-400"
            }
            focus:ring-primary-500/20
          `;

        default:
          return `
            ${baseStyles}
            ${
              checked
                ? "bg-primary-500 border-primary-500"
                : "bg-white border-gray-300 hover:border-gray-400"
            }
            focus:ring-primary-500/20
          `;
      }
    }
  };

  const getLabelStyles = () => {
    const base = `font-medium cursor-pointer select-none ${currentSize.label}`;

    if (theme === "dark") {
      return `${base} ${
        error
          ? "text-primary-400"
          : success
          ? "text-green-400"
          : "text-gray-300"
      }`;
    }
    return `${base} ${
      error ? "text-primary-600" : success ? "text-green-600" : "text-gray-700"
    }`;
  };

  const getDescriptionStyles = () => {
    return theme === "dark" ? "text-gray-400 mt-1" : "text-gray-500 mt-1";
  };

  const getMessageStyles = (type: "error" | "success") => {
    const base = "flex items-start gap-2 px-3 py-2 rounded-lg text-sm mt-2";

    if (theme === "dark") {
      return type === "error"
        ? `${base} text-primary-300 bg-primary-900/30 border border-primary-800/50`
        : `${base} text-green-300 bg-green-900/30 border border-green-800/50`;
    }
    return type === "error"
      ? `${base} text-primary-600 bg-primary-50/80 border border-primary-100`
      : `${base} text-green-600 bg-green-50/80 border border-green-100`;
  };

  const fieldName = name || (id as Path<T>);

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <div className={getContainerStyles()}>
        <div className="relative flex items-center">
          <input
            id={id}
            type="checkbox"
            disabled={disabled}
            {...(register ? register(fieldName) : {})}
            checked={checked}
            onChange={(e) => {
              if (onChange) {
                onChange(e.target.checked);
              }
            }}
            value={value}
            className={`
              absolute opacity-0 w-full h-full cursor-pointer
              ${disabled ? "cursor-not-allowed" : ""}
            `}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${id}-error` : success ? `${id}-success` : undefined
            }
            {...props}
          />
          <div className={getCheckboxStyles()}>
            {checked && (
              <Check className={`${currentSize.icon} text-white stroke-[3]`} />
            )}
          </div>
        </div>

        <div className="flex-1">
          <label htmlFor={id} className={getLabelStyles()}>
            {label}
            {required && <span className="text-primary-500 ml-1">*</span>}
          </label>

          {description && (
            <p
              className={`${getDescriptionStyles()} ${currentSize.description}`}
            >
              {description}
            </p>
          )}

          {hint && (
            <p
              className={`${getDescriptionStyles()} ${
                currentSize.description
              } mt-1`}
            >
              {hint}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`
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
            <Icon className={currentSize.icon} />
          </div>
        )}
      </div>

      {error && (
        <div
          id={`${id}-error`}
          className={getMessageStyles("error")}
          role="alert"
        >
          <AlertCircle className={`${currentSize.icon} mt-0.5 flex-shrink-0`} />
          <span>{error}</span>
        </div>
      )}

      {success && !error && (
        <div
          id={`${id}-success`}
          className={getMessageStyles("success")}
          role="status"
        >
          <CheckCircle className={`${currentSize.icon} mt-0.5 flex-shrink-0`} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
