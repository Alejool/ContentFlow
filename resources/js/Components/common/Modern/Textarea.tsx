import Label from "@/Components/common/Modern/Label";
import { useTheme } from "@/Hooks/useTheme";
import { TriangleAlert, CheckCircle, LucideIcon } from "lucide-react";
import { TextareaHTMLAttributes, useState } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

interface TextareaProps<T extends FieldValues = FieldValues>
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> {
  id: string;
  label?: string;
  error?: string;
  success?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  containerClassName?: string;
  icon?: LucideIcon;
  theme?: "dark" | "light";
  hint?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  rows?: number;
}

export default function Textarea<T extends FieldValues>({
  id,
  label,
  error,
  success,
  register,
  name,
  placeholder,
  disabled = false,
  className = "",
  containerClassName = "",
  icon: Icon,
  theme: propTheme,
  hint,
  size = "md",
  variant = "default",
  required = false,
  maxLength,
  showCharCount = false,
  rows = 4,
  ...props
}: TextareaProps<T>) {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;
  const [charCount, setCharCount] = useState(0);

  const sizeConfig = {
    sm: { textarea: "py-1 px-2 text-xs", icon: "w-3 h-3", label: "text-xs" },
    md: { textarea: "py-2 px-3 text-sm", icon: "w-4 h-4", label: "text-sm" },
    lg: { textarea: "py-3 px-4 text-base", icon: "w-5 h-5", label: "text-base" },
  };

  const currentSize = sizeConfig[size];


  const getMessageStyles = (type: "error" | "success") => {
    const base = "flex items-start align-center gap-2  py-2 rounded-lg text-sm";

    if (theme === "dark") {
      return type === "error"
        ? `${base} text-primary-600`
        : `${base} text-green-600`;
    }
    return type === "error"
      ? `${base} text-primary-600`
      : `${base} text-green-600`;
  };

  
  const getTextareaStyles = () => {
    const base = `
      block w-full rounded-lg border transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none
      ${disabled ? "cursor-not-allowed" : ""}
      ${Icon ? "pl-10" : "pl-4"}
      pr-4
      ${currentSize.textarea}
    `;

    if (theme === "dark") {
      if (error) return `${base} border-primary-500 bg-neutral-800 text-white`;
      if (success) return `${base} border-green-500 bg-neutral-800 text-white`;
      if (variant === "outlined")
        return `${base} border-2 border-neutral-600 bg-transparent text-white`;
      if (variant === "filled")
        return `${base} border-neutral-700 bg-neutral-800 text-white`;
      return `${base} border-neutral-700/50 bg-neutral-800/50 text-white`;
    } else {
      if (error) return `${base} border-primary-500 bg-white text-gray-900`;
      if (success) return `${base} border-green-500 bg-white text-gray-900`;
      if (variant === "outlined")
        return `${base} border-2 border-gray-300 bg-transparent text-gray-900`;
      if (variant === "filled")
        return `${base} border-gray-300 bg-gray-50 text-gray-900`;
      return `${base} border-gray-300 bg-white text-gray-900`;
    }
  };

  // Registrar el campo con manejo de cambio para el contador
  const { onChange, ...registerRest } = register(name);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (showCharCount) {
      setCharCount(e.target.value.length);
    }
    // Llamar al onChange original de react-hook-form
    onChange(e);
  };

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <Label
          htmlFor={id}
          size={size}
          required={required}
          error={error}
          success={success}
        >
          {label}
        </Label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-3">
            <Icon
              className={`${currentSize.icon} ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
          </div>
        )}

        <textarea
          id={id}
          rows={rows}
          disabled={disabled}
          {...registerRest}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${getTextareaStyles()} ${className}`}
          maxLength={maxLength}
          aria-invalid={!!error}
          {...props}
        />

        {error && (
          <div className={getMessageStyles("error")} role="alert">
            <TriangleAlert
              className={`${currentSize.icon} mt-0.5 flex-shrink-0`}
            />
            <span>{error}</span>
          </div>
        )}

        {success && !error && (
          <div className={getMessageStyles("success")} role="status">
            <CheckCircle
              className={`${currentSize.icon} mt-0.5 flex-shrink-0`}
            />
            <span>{success}</span>
          </div>
        )}

        {showCharCount && maxLength && (
          <div className="text-xs text-gray-500">
            {charCount}/{maxLength} characters
          </div>
        )}
      </div>
    </div>
  );
}
