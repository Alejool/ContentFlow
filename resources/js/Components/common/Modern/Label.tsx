import { useTheme } from "@/Hooks/useTheme";
import { AlertCircle, CheckCircle, Info, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface LabelProps {
  id?: string;
  htmlFor?: string;
  children: ReactNode;
  error?: string;
  success?: string;
  info?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  icon?: LucideIcon;
  theme?: "dark" | "light";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "bold" | "subtle" | "highlighted";
  align?: "left" | "center" | "right";
  tooltip?: string;
  badge?: string | number;
  badgeColor?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info";
  withIndicator?: boolean;
  indicatorColor?: "primary" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
}

export default function Label({
  id,
  htmlFor,
  children,
  error,
  success,
  info,
  required = false,
  disabled = false,
  className = "",
  containerClassName = "",
  icon: Icon,
  theme: propTheme,
  size = "md",
  variant = "default",
  align = "left",
  tooltip,
  badge,
  badgeColor = "primary",
  withIndicator = false,
  indicatorColor = "primary",
  onClick,
  ...props
}: LabelProps) {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;

  // Configuración de tamaños
  const sizeConfig = {
    xs: {
      label: "text-xs",
      icon: "w-3 h-3",
      badge: "text-[10px] px-1.5 py-0.5",
      indicator: "w-1.5 h-1.5",
    },
    sm: {
      label: "text-sm",
      icon: "w-3.5 h-3.5",
      badge: "text-xs px-2 py-0.5",
      indicator: "w-2 h-2",
    },
    md: {
      label: "text-base",
      icon: "w-4 h-4",
      badge: "text-sm px-2.5 py-1",
      indicator: "w-2.5 h-2.5",
    },
    lg: {
      label: "text-lg",
      icon: "w-5 h-5",
      badge: "text-base px-3 py-1",
      indicator: "w-3 h-3",
    },
    xl: {
      label: "text-xl",
      icon: "w-6 h-6",
      badge: "text-lg px-3.5 py-1",
      indicator: "w-3.5 h-3.5",
    },
  };

  const currentSize = sizeConfig[size];

  const getContainerStyles = () => {
    const baseStyles = ` ${
      onClick ? "cursor-pointer hover:opacity-90 active:scale-95" : ""
    } ${
      align === "center"
        ? "justify-center"
        : align === "right"
        ? "justify-end"
        : ""
    }`;

    if (disabled) {
      return `${baseStyles} opacity-60 ${onClick ? "cursor-not-allowed" : ""}`;
    }

    return baseStyles;
  };

  const getLabelStyles = () => {
    const base = `font-medium tracking-tight ${currentSize.label}`;

    switch (variant) {
      case "bold":
        return `${base} font-bold ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`;

      case "subtle":
        return `${base} ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`;

      case "highlighted":
        return `${base} font-semibold ${
          theme === "dark"
            ? "bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent"
            : "bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"
        }`;

      default:
        return `${base} ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`;
    }
  };

  const getIconStyles = () => {
    if (error) {
      return theme === "dark" ? "text-primary-400" : "text-primary-500";
    }
    if (success) {
      return theme === "dark" ? "text-green-400" : "text-green-500";
    }
    if (info) {
      return theme === "dark" ? "text-blue-400" : "text-blue-500";
    }
    return theme === "dark" ? "text-gray-400" : "text-gray-500";
  };

  const getBadgeStyles = () => {
    const base = `rounded-full font-semibold ${currentSize.badge}`;

    if (theme === "dark") {
      switch (badgeColor) {
        case "primary":
          return `${base} bg-primary-900/40 text-primary-300 border border-primary-800/50`;
        case "secondary":
          return `${base} bg-neutral-800 text-gray-300 border border-neutral-700`;
        case "success":
          return `${base} bg-green-900/40 text-green-300 border border-green-800/50`;
        case "warning":
          return `${base} bg-yellow-900/40 text-yellow-300 border border-yellow-800/50`;
        case "error":
          return `${base} bg-red-900/40 text-red-300 border border-red-800/50`;
        case "info":
          return `${base} bg-blue-900/40 text-blue-300 border border-blue-800/50`;
        default:
          return `${base} bg-primary-900/40 text-primary-300`;
      }
    } else {
      switch (badgeColor) {
        case "primary":
          return `${base} bg-primary-100 text-primary-800 border border-primary-200`;
        case "secondary":
          return `${base} bg-gray-100 text-gray-700 border border-gray-200`;
        case "success":
          return `${base} bg-green-100 text-green-800 border border-green-200`;
        case "warning":
          return `${base} bg-yellow-100 text-yellow-800 border border-yellow-200`;
        case "error":
          return `${base} bg-red-100 text-red-800 border border-red-200`;
        case "info":
          return `${base} bg-blue-100 text-blue-800 border border-blue-200`;
        default:
          return `${base} bg-primary-100 text-primary-800`;
      }
    }
  };

  const getIndicatorStyles = () => {
    const base = `rounded-full ${currentSize.indicator} animate-pulse`;

    if (theme === "dark") {
      switch (indicatorColor) {
        case "primary":
          return `${base} bg-primary-500`;
        case "success":
          return `${base} bg-green-500`;
        case "warning":
          return `${base} bg-yellow-500`;
        case "error":
          return `${base} bg-red-500`;
        case "info":
          return `${base} bg-blue-500`;
        default:
          return `${base} bg-primary-500`;
      }
    } else {
      switch (indicatorColor) {
        case "primary":
          return `${base} bg-primary-500`;
        case "success":
          return `${base} bg-green-500`;
        case "warning":
          return `${base} bg-yellow-500`;
        case "error":
          return `${base} bg-red-500`;
        case "info":
          return `${base} bg-blue-500`;
        default:
          return `${base} bg-primary-500`;
      }
    }
  };

  const getMessageStyles = (type: "error" | "success" | "info") => {
    const base = "flex items-start gap-2 px-3 py-2 rounded-lg text-sm mt-2";

    if (theme === "dark") {
      switch (type) {
        case "error":
          return `${base} text-primary-300 bg-primary-900/30 border border-primary-800/50`;
        case "success":
          return `${base} text-green-300 bg-green-900/30 border border-green-800/50`;
        case "info":
          return `${base} text-blue-300 bg-blue-900/30 border border-blue-800/50`;
      }
    } else {
      switch (type) {
        case "error":
          return `${base} text-primary-600 bg-primary-50/80 border border-primary-100`;
        case "success":
          return `${base} text-green-600 bg-green-50/80 border border-green-100`;
        case "info":
          return `${base} text-blue-600 bg-blue-50/80 border border-blue-100`;
      }
    }
  };

  const renderIcon = () => {
    if (error) {
      return (
        <AlertCircle className={`${currentSize.icon} ${getIconStyles()}`} />
      );
    }
    if (success) {
      return (
        <CheckCircle className={`${currentSize.icon} ${getIconStyles()}`} />
      );
    }
    if (info) {
      return <Info className={`${currentSize.icon} ${getIconStyles()}`} />;
    }
    if (Icon) {
      return <Icon className={`${currentSize.icon} ${getIconStyles()}`} />;
    }
    return null;
  };

  return (
    <div className={`space-y-2 mb-1 ${containerClassName}`}>
      <div className={getContainerStyles()}>
        <label
          id={id}
          htmlFor={htmlFor}
          className={`${getLabelStyles()} ${className}`}
          title={tooltip}
          onClick={onClick}
          {...props}
        >
          {withIndicator && (
            <span
              className={`${getIndicatorStyles()} mr-2`}
              title={`${indicatorColor} indicator`}
            />
          )}
          <span className="flex items-center gap-2">
            {children}

            {required && (
              <span
                className={
                  theme === "dark" ? "text-primary-400" : "text-primary-500"
                }
              >
                *
              </span>
            )}
          </span>

          {badge && <span className={`${getBadgeStyles()} ml-2`}>{badge}</span>}
        </label>
      </div>
    </div>
  );
}
