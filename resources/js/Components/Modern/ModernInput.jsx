import React, { useState } from "react";

const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.121-3.879a9.973 9.973 0 011.563 3.029m-1.563-3.029L21 21"
    />
  </svg>
);

export default function ModernInput({
  id,
  label,
  type = "text",
  error,
  register,
  placeholder,
  showPasswordToggle = false,
  disabled = false,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          disabled={disabled}
          {...(register ? register(id) : {})}
          placeholder={placeholder}
          className={`
            block w-full px-4 py-3 text-gray-900 placeholder-gray-400 
            bg-white border-2 rounded-xl shadow-sm transition-all duration-200
            focus:outline-none focus:ring-0 hover:shadow-md
            ${
              error
                ? "border-red-300 focus:border-red-500 bg-red-50"
                : "border-gray-200 focus:border-blue-500 focus:bg-gray-50"
            }
            ${disabled ? "bg-gray-100 cursor-not-allowed opacity-75" : ""}
            ${showPasswordToggle ? "pr-12" : ""}
          `}
          {...props}
        />
        {showPasswordToggle && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg animate-pulse">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
