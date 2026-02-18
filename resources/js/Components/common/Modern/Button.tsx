import { useTheme } from "@/Hooks/useTheme";
import {
  ButtonHTMLAttributes,
  ComponentType,
  ReactNode,
  forwardRef,
  isValidElement,
} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?:
    | "primary"
    | "danger"
    | "secondary"
    | "success"
    | "ghost"
    | "warning";
  buttonStyle?: "solid" | "outline" | "gradient" | "ghost";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  iconPosition?: "left" | "right";
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  animation?: "none" | "pulse" | "bounce";
  theme?: "light" | "dark";
  icon?: any;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      type = "button",
      disabled = false,
      variant = "primary",
      buttonStyle = "gradient",
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
      theme,
      ...props
    },
    ref,
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
        text: "text-black dark:text-white",
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
        text: "text-black dark:text-white",
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
        text: "text-black dark:text-white",
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
        text: "text-black dark:text-white",
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
        hoverBg: "hover:bg-gray-100 dark:hover:bg-gray-800",
        text: "text-black dark:text-white",
        border: "border-gray-300 dark:border-gray-700",
        hoverText: "hover:text-gray-700 dark:hover:text-gray-300",
        focusRing: "focus:ring-gray-500",
        from: "from-transparent",
        to: "to-transparent",
        hoverFrom: "hover:from-gray-100 dark:hover:from-gray-800",
        hoverTo: "hover:to-gray-100 dark:hover:to-gray-800",
      },
    };

    const themeContext = useTheme();
    const currentTheme = theme || themeContext.actualTheme || "light";

    const colors = variantColors[variant] || variantColors.primary;

    const getStyleClasses = () => {
      switch (buttonStyle) {
        case "gradient":
          return `
            ${colors.text}
            bg-gradient-to-r ${colors.from} ${colors.to}
            hover:bg-gradient-to-r ${colors.hoverFrom} ${colors.hoverTo}
            border-0
            ${currentTheme === "dark" && variant === "ghost" ? "dark" : ""}
          `;
        case "outline":
          return `
            bg-transparent
            border-2 ${colors.border}
            ${colors.text}
            hover:bg-opacity-10 hover:${colors.hoverBg.replace("hover:", "")}
            ${
              currentTheme === "dark" && variant === "ghost"
                ? "dark:border-gray-700 dark:text-gray-300"
                : ""
            }
          `;
        case "ghost":
          return `
            ${colors.text}
            bg-transparent
            border border-gray-300 dark:border-gray-700
            hover:${colors.hoverBg}
            hover:${colors.hoverText}
            ${
              currentTheme === "dark"
                ? "dark:hover:bg-gray-800 dark:hover:text-gray-300"
                : ""
            }
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
      lg: "rounded-lg",
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
      ${
        currentTheme === "dark"
          ? "focus:ring-offset-gray-900"
          : "focus:ring-offset-white"
      }
    `;

    const isActuallyLoading = loading;
    const isActuallyDisabled = disabled || loading;
    const displayLoadingText = loadingText || "Processing...";

    const renderIcon = (position: "left" | "right") => {
      if (!icon || iconPosition !== position) return null;

      const isComponent =
        typeof icon === "function" ||
        (typeof icon === "object" &&
          icon !== null &&
          "$$typeof" in (icon as any));

      if (isComponent && !isValidElement(icon)) {
        const IconComponent = icon as ComponentType<any>;
        const iconSize = (
          {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
          } as const
        )[size];

        return <IconComponent size={iconSize} className="flex-shrink-0" />;
      }

      return icon;
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isActuallyDisabled}
        onClick={onClick}
        className={`${baseStyles} ${className}`}
        {...props}
      >
        {isActuallyLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{displayLoadingText}</span>
          </>
        ) : (
          <>
            {renderIcon("left")}
            <span>{children}</span>
            {renderIcon("right")}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
