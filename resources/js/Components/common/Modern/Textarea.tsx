import Label from "@/Components/common/Modern/Label";
import { CheckCircle, LucideIcon, TriangleAlert } from "lucide-react";
import { TextareaHTMLAttributes, useState } from "react";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

interface TextareaProps<T extends FieldValues = FieldValues> extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name"
> {
  id: string;
  label?: string;
  error?: string;
  success?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  containerClassName?: string;
  icon?: LucideIcon;
  hint?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  rows?: number;
  activeColor?: string;
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
  hint,
  size = "md",
  variant = "default",
  required = false,
  maxLength,
  showCharCount = false,
  rows = 4,
  activeColor,
  ...props
}: TextareaProps<T>) {
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const sizeConfig = {
    sm: { textarea: "py-1 px-2 text-xs", icon: "w-3 h-3", label: "text-xs" },
    md: { textarea: "py-2 px-3 text-sm", icon: "w-4 h-4", label: "text-sm" },
    lg: {
      textarea: "py-3 px-4 text-base",
      icon: "w-5 h-5",
      label: "text-base",
    },
  };

  const currentSize = sizeConfig[size];

  const getMessageStyles = (type: "error" | "success") => {
    return type === "error"
      ? "flex items-start align-center gap-2 py-2 rounded-lg text-sm text-primary-600"
      : "flex items-start align-center gap-2 py-2 rounded-lg text-sm text-green-600";
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

    if (error)
      return `${base} border-primary-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white`;
    if (success)
      return `${base} border-green-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white`;
    if (variant === "outlined")
      return `${base} border-2 border-gray-300 dark:border-neutral-600 bg-transparent text-gray-900 dark:text-white`;
    if (variant === "filled")
      return `${base} border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white`;
    return `${base} border-gray-300/50 dark:border-neutral-700/50 bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white`;
  };

  const { onChange, ...registerRest } = register(name);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (showCharCount) {
      setCharCount(e.target.value.length);
    }
    onChange(e);
  };

  return (
    <div className={` ${containerClassName}`}>
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
              className={`${currentSize.icon} text-gray-500 dark:text-gray-400`}
            />
          </div>
        )}

        <textarea
          id={id}
          rows={rows}
          disabled={disabled}
          {...registerRest}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={placeholder}
          className={`${getTextareaStyles()} ${className}`}
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
          <div className="text-xs mt-1 text-gray-500">
            {charCount}/{maxLength} characters
          </div>
        )}
      </div>
    </div>
  );
}
