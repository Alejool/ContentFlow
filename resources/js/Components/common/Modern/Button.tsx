import { useTheme } from "@/Hooks/useTheme";
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?:
    | "primary"
    | "danger"
    | "secondary"
    | "success"
    | "ghost"
    | "warning";
  style?: "solid" | "outline" | "gradient" | "ghost";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  animation?: "none" | "pulse" | "bounce";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      type = "button",
      disabled = false,
      variant = "primary",
      style = "gradient",
      size = "md",
      className = "",
      onClick,
      loading = false,
      loadingText,
      fullWidth = false,
      icon,
      iconPosition = "left",
      rounded = "md",
      shadow = "md",
      animation = "none",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-base",
      lg: "px-5 py-3 text-lg",
      xl: "px-6 py-3.5 text-xl",
    };

    const variantColors = {
      primary: {
        bg: "bg-primary-600",
        hoverBg: "hover:bg-primary-700",
        text: "text-white",
        border: "border-primary-600",
        hoverText: "hover:text-white",
        focusRing: "focus:ring-primary-500",
        from: "from-primary-600",
        to: "to-primary-700",
        hoverFrom: "hover:from-primary-700",
        hoverTo: "hover:to-primary-800",
      },
      danger: {
        bg: "bg-red-600",
        hoverBg: "hover:bg-red-700",
        text: "text-white",
        border: "border-red-600",
        hoverText: "hover:text-white",
        focusRing: "focus:ring-red-500",
        from: "from-red-500",
        to: "to-red-600",
        hoverFrom: "hover:from-red-600",
        hoverTo: "hover:to-red-700",
      },
      secondary: {
        bg: "bg-gray-300",
        hoverBg: "hover:bg-gray-400",
        text: "text-gray-800",
        border: "border-gray-300",
        hoverText: "hover:text-gray-800",
        focusRing: "focus:ring-gray-500",
        from: "from-gray-200",
        to: "to-gray-300",
        hoverFrom: "hover:from-gray-300",
        hoverTo: "hover:to-gray-400",
      },
      success: {
        bg: "bg-green-600",
        hoverBg: "hover:bg-green-700",
        text: "text-white",
        border: "border-green-600",
        hoverText: "hover:text-white",
        focusRing: "focus:ring-green-500",
        from: "from-green-500",
        to: "to-emerald-600",
        hoverFrom: "hover:from-green-600",
        hoverTo: "hover:to-emerald-700",
      },
      warning: {
        bg: "bg-yellow-600",
        hoverBg: "hover:bg-yellow-700",
        text: "text-white",
        border: "border-yellow-600",
        hoverText: "hover:text-white",
        focusRing: "focus:ring-yellow-500",
        from: "from-yellow-500",
        to: "to-orange-500",
        hoverFrom: "hover:from-yellow-600",
        hoverTo: "hover:to-orange-600",
      },
      ghost: {
        bg: "bg-transparent",
        hoverBg: "hover:bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-300",
        hoverText: "hover:text-gray-700",
        focusRing: "focus:ring-gray-500",
        from: "from-transparent",
        to: "to-transparent",
        hoverFrom: "hover:from-gray-100",
        hoverTo: "hover:to-gray-100",
      },
    };

    const theme = useTheme();

    const colors = variantColors[variant] || variantColors.primary;

    const getStyleClasses = () => {
      switch (style) {
        case "gradient":
          return `
            ${colors.text}
            bg-gradient-to-r ${colors.from} ${colors.to}
            hover:bg-gradient-to-r ${colors.hoverFrom} ${colors.hoverTo}
            border-0
          `;
        case "outline":
          return `
            bg-transparent
            border-2 ${colors.border}
            hover:${colors.hoverBg.replace("bg-", "bg-opacity-10 ")}
            hover:${colors.border.replace("border-", "border-")}
          `;
        case "ghost":
          return `
            ${colors.text}
            bg-transparent
            border border-gray-300
            hover:${colors.hoverBg}
            hover:${colors.hoverText}
          `;
        case "solid":
        default:
          return `
            ${colors.text}
            ${colors.bg}
            ${colors.hoverBg}
            border-0
          `;
      }
    };

    const roundedClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-lg",
      lg: "rounded-xl",
      full: "rounded-full",
    };

    const shadowClasses = {
      none: "shadow-none",
      sm: "shadow-sm",
      md: "shadow",
      lg: "shadow-lg",
      xl: "shadow-xl",
    };

    const animationClasses = {
      none: "",
      pulse: "animate-pulse",
      bounce: "animate-bounce",
    };

    const baseStyles = `
      font-medium transition-all duration-200
      flex items-center justify-center gap-2
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2
      active:scale-[0.98]
      ${fullWidth ? "w-full" : ""}
      ${sizeClasses[size]}
      ${getStyleClasses()}
      ${roundedClasses[rounded]}
      ${shadowClasses[shadow]}
      ${animationClasses[animation]}
      ${colors.focusRing}
    `;

    const isLoading = loading || disabled;
    const displayLoadingText = loadingText || "Processing...";

    return (
      <button
        ref={ref}
        type={type}
        disabled={isLoading}
        onClick={onClick}
        className={`${baseStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-1 border-current border-t-transparent rounded-full animate-spin" />
            <span>{displayLoadingText}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && icon}
            <span>{children}</span>
            {icon && iconPosition === "right" && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
