import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "danger" | "secondary" | "success";
  icon?: LucideIcon;
}

export default function ModernButton({
  children,
  type = "submit",
  disabled = false,
  variant = "primary",
  className = "",
  onClick,
  icon: Icon,
  ...props
}: ModernButtonProps) {
  const baseStyles =
    "w-full px-6 py-4 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variants = {
    primary:
      "text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
    danger:
      "text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700",
    secondary:
      "text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300",
    success:
      "text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {disabled ? (
        <>
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  );
}
