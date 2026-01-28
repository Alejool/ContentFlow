import { useTheme } from "@/Hooks/useTheme";
import { LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

import Skeleton from "../common/ui/Skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode | LucideIcon;
  color?:
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "red"
    | "indigo"
    | "teal"
    | "pink"
    | "amber"
    | "sky";
  format?: "number" | "currency" | "percentage";
  theme?: "dark" | "light";
  compact?: boolean;
  variant?: 1 | 2 | 3 | 4;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = "blue",
  format = "number",
  theme: propTheme,
  compact = false,
  isLoading,
  variant,
}) => {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;

  const getColorClasses = () => {
    // Base color configurations
    const colorMap = {
      blue: {
        dark: {
          gradient: "from-blue-600 to-blue-800",
          bg: "bg-blue-900/30",
          text: "text-blue-300",
          border: "border-blue-700/50",
          iconBg: "bg-blue-500/20",
          glow: "from-blue-600/20",
        },
        light: {
          gradient: "from-blue-500 to-blue-600",
          bg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-200",
          iconBg: "bg-white/20",
          glow: "from-blue-200/40",
        },
      },
      green: {
        dark: {
          gradient: "from-emerald-600 to-emerald-800",
          bg: "bg-emerald-900/30",
          text: "text-emerald-300",
          border: "border-emerald-700/50",
          iconBg: "bg-emerald-500/20",
          glow: "from-emerald-600/20",
        },
        light: {
          gradient: "from-emerald-500 to-emerald-600",
          bg: "bg-emerald-100",
          text: "text-emerald-600",
          border: "border-emerald-200",
          iconBg: "bg-white/20",
          glow: "from-emerald-200/40",
        },
      },
      purple: {
        dark: {
          gradient: "from-purple-600 to-purple-800",
          bg: "bg-purple-900/30",
          text: "text-purple-300",
          border: "border-purple-700/50",
          iconBg: "bg-purple-500/20",
          glow: "from-purple-600/20",
        },
        light: {
          gradient: "from-purple-500 to-purple-600",
          bg: "bg-purple-100",
          text: "text-purple-600",
          border: "border-purple-200",
          iconBg: "bg-white/20",
          glow: "from-purple-200/40",
        },
      },
      orange: {
        dark: {
          gradient: "from-orange-600 to-orange-800",
          bg: "bg-orange-900/30",
          text: "text-orange-300",
          border: "border-orange-700/50",
          iconBg: "bg-orange-500/20",
          glow: "from-orange-600/20",
        },
        light: {
          gradient: "from-orange-500 to-orange-600",
          bg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-200",
          iconBg: "bg-white/20",
          glow: "from-orange-200/40",
        },
      },
      red: {
        dark: {
          gradient: "from-rose-600 to-rose-800",
          bg: "bg-rose-900/30",
          text: "text-rose-300",
          border: "border-rose-700/50",
          iconBg: "bg-rose-500/20",
          glow: "from-rose-600/20",
        },
        light: {
          gradient: "from-rose-500 to-rose-600",
          bg: "bg-rose-100",
          text: "text-rose-600",
          border: "border-rose-200",
          iconBg: "bg-white/20",
          glow: "from-rose-200/40",
        },
      },
      indigo: {
        dark: {
          gradient: "from-indigo-600 to-indigo-800",
          bg: "bg-indigo-900/30",
          text: "text-indigo-300",
          border: "border-indigo-700/50",
          iconBg: "bg-indigo-500/20",
          glow: "from-indigo-600/20",
        },
        light: {
          gradient: "from-indigo-500 to-indigo-600",
          bg: "bg-indigo-100",
          text: "text-indigo-600",
          border: "border-indigo-200",
          iconBg: "bg-white/20",
          glow: "from-indigo-200/40",
        },
      },
      teal: {
        dark: {
          gradient: "from-teal-600 to-teal-800",
          bg: "bg-teal-900/30",
          text: "text-teal-300",
          border: "border-teal-700/50",
          iconBg: "bg-teal-500/20",
          glow: "from-teal-600/20",
        },
        light: {
          gradient: "from-teal-500 to-teal-600",
          bg: "bg-teal-100",
          text: "text-teal-600",
          border: "border-teal-200",
          iconBg: "bg-white/20",
          glow: "from-teal-200/40",
        },
      },
      pink: {
        dark: {
          gradient: "from-pink-600 to-pink-800",
          bg: "bg-pink-900/30",
          text: "text-pink-300",
          border: "border-pink-700/50",
          iconBg: "bg-pink-500/20",
          glow: "from-pink-600/20",
        },
        light: {
          gradient: "from-pink-500 to-pink-600",
          bg: "bg-pink-100",
          text: "text-pink-600",
          border: "border-pink-200",
          iconBg: "bg-white/20",
          glow: "from-pink-200/40",
        },
      },
      amber: {
        dark: {
          gradient: "from-amber-600 to-amber-800",
          bg: "bg-amber-900/30",
          text: "text-amber-300",
          border: "border-amber-700/50",
          iconBg: "bg-amber-500/20",
          glow: "from-amber-600/20",
        },
        light: {
          gradient: "from-amber-500 to-amber-600",
          bg: "bg-amber-100",
          text: "text-amber-600",
          border: "border-amber-200",
          iconBg: "bg-white/20",
          glow: "from-amber-200/40",
        },
      },
      sky: {
        dark: {
          gradient: "from-sky-600 to-sky-800",
          bg: "bg-sky-900/30",
          text: "text-sky-300",
          border: "border-sky-700/50",
          iconBg: "bg-sky-500/20",
          glow: "from-sky-600/20",
        },
        light: {
          gradient: "from-sky-500 to-sky-600",
          bg: "bg-sky-100",
          text: "text-sky-600",
          border: "border-sky-200",
          iconBg: "bg-white/20",
          glow: "from-sky-200/40",
        },
      },
    };

    // Get base configuration
    const baseConfig = (colorMap as any)[color] || colorMap.blue;
    const currentThemeConfig = baseConfig[theme];

    // If no variant, return base config
    if (!variant) return currentThemeConfig;

    // Apply variants dynamically based on base color
    // We modify gradients to create subtle differences while keeping the main color family
    const getVariantGradient = (
      baseColor: string,
      variantNum: number,
      themeMode: "dark" | "light",
    ) => {
      // Map base colors to their Tailwind variants to construct dynamic gradients
      // This is a simplified approach. For full flexibility, we'd need a map for every combo.
      // But assuming standard Tailwind naming (orange-500, etc.)

      // Define variant shifts relative to the base color
      // Variant 1: Standard (already in baseConfig)
      // Variant 2: Slightly Darker/Deeper (shift up 100)
      // Variant 3: Shifted Hue (e.g. Orange -> Amber-ish or Red-ish)
      // Variant 4: Lighter/Softer

      if (variantNum === 1) return currentThemeConfig.gradient;

      // Since we can't easily generate class strings dynamically without them being purged,
      // we must provide specific overrides for the requested setup (Oracle -> Orange)
      // or define a "Variant Map" for supported colors.

      const variantMaps: Record<string, Record<number, string>> = {
        orange: {
          2:
            themeMode === "dark"
              ? "from-orange-700 to-orange-900"
              : "from-orange-600 to-orange-700",
          3:
            themeMode === "dark"
              ? "from-orange-600 via-red-700 to-red-800"
              : "from-orange-500 via-red-500 to-red-600", // Red shift
          4:
            themeMode === "dark"
              ? "from-amber-600 via-orange-700 to-orange-800"
              : "from-amber-500 via-orange-500 to-orange-600", // Amber shift
        },
        blue: {
          2:
            themeMode === "dark"
              ? "from-blue-700 to-blue-900"
              : "from-blue-600 to-blue-700",
          3:
            themeMode === "dark"
              ? "from-blue-600 via-indigo-700 to-indigo-800"
              : "from-blue-500 via-indigo-500 to-indigo-600", // Indigo shift
          4:
            themeMode === "dark"
              ? "from-sky-600 via-blue-700 to-blue-800"
              : "from-sky-500 via-blue-500 to-blue-600", // Sky shift
        },
        // Default fallbacks for others if needed, using simple logic or just returning base
      };

      const colorSpecificVariants = variantMaps[color];
      if (colorSpecificVariants && colorSpecificVariants[variantNum]) {
        return colorSpecificVariants[variantNum];
      }

      // Fallback: if no specific variant defined, return base
      return currentThemeConfig.gradient;
    };

    return {
      ...currentThemeConfig,
      gradient: getVariantGradient(color, variant, theme),
    };
  };

  const formatValue = (val: string | number) => {
    const numValue = typeof val === "string" ? parseFloat(val) : val;

    if (format === "currency") {
      return `$${numValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }
    if (format === "percentage") {
      return `${numValue.toFixed(2)}%`;
    }
    return numValue.toLocaleString();
  };

  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0)
      return <TrendingDown className="w-4 h-4 text-primary-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === null)
      return theme === "dark" ? "text-gray-400" : "text-gray-600";
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-primary-500";
    return theme === "dark" ? "text-gray-400" : "text-gray-600";
  };

  const getTrendBg = () => {
    if (change === undefined || change === null)
      return theme === "dark" ? "bg-neutral-800/50" : "bg-gray-100";
    if (change > 0) return theme === "dark" ? "bg-green-900/20" : "bg-green-50";
    if (change < 0)
      return theme === "dark" ? "bg-primary-900/20" : "bg-primary-50";
    return theme === "dark" ? "bg-neutral-800/50" : "bg-gray-100";
  };

  const colors = getColorClasses();

  const getCardStyles = () => {
    const baseStyles =
      "relative rounded-lg overflow-hidden transition-all duration-300 hover:shadow-2xl group";
    const darkStyles = `bg-neutral-800/40 backdrop-blur-md border ${colors.border} hover:bg-neutral-800/60`;
    const lightStyles = `bg-white border ${colors.border} hover:shadow-lg`;

    return `${baseStyles} ${theme === "dark" ? darkStyles : lightStyles}`;
  };
  return (
    <div className={getCardStyles()}>
      <div
        className={`bg-gradient-to-r ${colors.gradient} ${compact ? "p-3" : "p-4"}`}
      >
        <div className="flex items-center justify-between text-white relative z-10">
          {isLoading ? (
            <Skeleton className="h-4 w-24 bg-white/20 dark:bg-white/10" />
          ) : (
            <h3
              className={`${
                compact ? "text-xs" : "text-sm"
              } font-medium opacity-90`}
            >
              {title}
            </h3>
          )}
          {(typeof Icon === "function" || Icon) && (
            <div
              className={`${
                compact ? "w-6 h-6" : "w-8 h-8"
              } rounded-lg flex items-center justify-center backdrop-blur-sm ${colors.iconBg || "bg-white/10"}`}
            >
              {isLoading ? (
                <Skeleton className="w-4 h-4 rounded bg-white/20 dark:bg-white/10" />
              ) : typeof Icon === "function" ? (
                <Icon
                  className={`${compact ? "w-3 h-3" : "w-4 h-4"} text-white`}
                />
              ) : (
                <div className="opacity-90">{Icon}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={compact ? "p-4" : "p-6"}>
        <div className="flex flex-col">
          {isLoading ? (
            <Skeleton
              className={`mb-2 ${compact ? "h-8 w-20" : "h-10 w-24"}`}
            />
          ) : (
            <p
              className={`font-bold ${compact ? "text-2xl" : "text-3xl"} ${
                theme === "dark" ? "text-white" : "text-gray-900"
              } mb-2`}
            >
              {formatValue(value)}
            </p>
          )}

          {isLoading ? (
            <Skeleton className="h-8 w-full rounded-lg" />
          ) : (
            change !== undefined &&
            change !== null && (
              <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getTrendBg()} transition-colors duration-300`}
              >
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {Math.abs(change)}%
                </span>
                <span
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  vs last period
                </span>
              </div>
            )
          )}
        </div>

        <div className="mt-4 flex items-center">
          {isLoading ? (
            <Skeleton className="h-1.5 flex-1 rounded-full" />
          ) : (
            <div className="flex-1 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-700`}
                style={{
                  width: `${Math.min(100, Math.abs(change || 0) * 10)}%`,
                }}
              />
            </div>
          )}
          {isLoading ? (
            <Skeleton className="ml-2 h-6 w-12 rounded" />
          ) : (
            <div
              className={`ml-2 text-xs px-2 py-1 rounded ${colors.bg} ${colors.text} font-medium`}
            ></div>
          )}
        </div>
      </div>

      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div
          className={`absolute -inset-1 bg-gradient-to-r ${
            colors.glow ||
            (theme === "dark"
              ? "from-blue-600/5 via-purple-600/3 to-pink-600/5"
              : "from-blue-200/10 via-purple-200/5 to-pink-200/10")
          } blur-xl`}
        ></div>
      </div>
    </div>
  );
};

export default StatCard;
