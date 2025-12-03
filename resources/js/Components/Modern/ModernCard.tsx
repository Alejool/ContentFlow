import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { useTheme } from "@/Hooks/useTheme";

interface ModernCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  headerColor?: "blue" | "red" | "green" | "orange" | "purple" | "custom";
  customGradient?: string; 
  className?: string;
  compact?: boolean;
  noBorder?: boolean;
  hoverEffect?: boolean;
}

export default function ModernCard({
  title,
  description,
  icon: Icon,
  children,
  headerColor = "orange",
  customGradient,
  className = "",
  compact = false,
  noBorder = false,
  hoverEffect = true,
}: ModernCardProps) {
  const { theme } = useTheme();

  const headerColors = {
    blue:
      theme === "dark"
        ? "from-blue-700 to-blue-900"
        : "from-blue-600 to-blue-800",
    red:
      theme === "dark" ? "from-red-700 to-red-900" : "from-red-600 to-red-800",
    green:
      theme === "dark"
        ? "from-green-700 to-green-900"
        : "from-green-600 to-green-800",
    orange:
      theme === "dark"
        ? "from-orange-600 to-orange-800"
        : "from-orange-600 to-orange-700",
    purple:
      theme === "dark"
        ? "from-purple-700 to-purple-900"
        : "from-purple-600 to-purple-800",
    custom: customGradient || "from-orange-600 to-orange-700",
  };

  const gradientClass =
    headerColor === "custom" && customGradient
      ? customGradient
      : headerColors[headerColor];

  const padding = compact ? "px-4 py-3" : "px-6 py-5";

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-300
        ${theme === "dark" ? "bg-neutral-800/50" : "bg-white"}
        ${
          !noBorder &&
          (theme === "dark"
            ? "border border-neutral-700/50"
            : "border border-gray-200")
        }
        ${hoverEffect && "hover:shadow-lg "}
        ${className}`}
    >
      {/* Header */}
      <div className={`${padding} bg-gradient-to-r ${gradientClass}`}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={`${compact ? "w-8 h-8" : "w-10 h-10"} 
              bg-white/20 rounded-lg flex items-center justify-center`}
            >
              <Icon
                className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-white`}
              />
            </div>
          )}
          <div>
            <h2
              className={`font-bold text-white ${
                compact ? "text-base" : "text-lg"
              }`}
            >
              {title}
            </h2>
            {description && (
              <p
                className={`text-white/80 ${
                  compact ? "text-xs mt-0.5" : "text-sm mt-0.5"
                }`}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className={`${padding} ${
          theme === "dark" ? "bg-neutral-900/20" : "bg-gray-50/50"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
