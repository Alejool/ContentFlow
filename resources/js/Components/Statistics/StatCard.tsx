import { useTheme } from "@/Hooks/useTheme";
import { LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

import Skeleton from "../common/ui/Skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode | LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "indigo" | "teal";
  format?: "number" | "currency" | "percentage";
  theme?: "dark" | "light";
  compact?: boolean;
  isLoading?: boolean;
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
}) => {
  const { theme: themeFromHook } = useTheme();
  const theme = propTheme || themeFromHook;

  const getColorClasses = () => {
    const colorMap = {
      blue: {
        dark: {
          gradient: "from-blue-700 to-blue-800",
          bg: "bg-blue-900/20",
          text: "text-blue-400",
          border: "border-blue-800/30",
        },
        light: {
          gradient: "from-blue-500 to-blue-600",
          bg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-200",
        },
      },
      green: {
        dark: {
          gradient: "from-green-700 to-green-800",
          bg: "bg-green-900/20",
          text: "text-green-400",
          border: "border-green-800/30",
        },
        light: {
          gradient: "from-green-500 to-green-600",
          bg: "bg-green-100",
          text: "text-green-600",
          border: "border-green-200",
        },
      },
      purple: {
        dark: {
          gradient: "from-purple-700 to-purple-800",
          bg: "bg-purple-900/20",
          text: "text-purple-400",
          border: "border-purple-800/30",
        },
        light: {
          gradient: "from-purple-500 to-purple-600",
          bg: "bg-purple-100",
          text: "text-purple-600",
          border: "border-purple-200",
        },
      },
      orange: {
        dark: {
          gradient: "from-primary-600 to-primary-700",
          bg: "bg-primary-900/20",
          text: "text-primary-400",
          border: "border-primary-800/30",
        },
        light: {
          gradient: "from-primary-500 to-primary-600",
          bg: "bg-primary-100",
          text: "text-primary-600",
          border: "border-primary-200",
        },
      },
      red: {
        dark: {
          gradient: "from-primary-700 to-primary-800",
          bg: "bg-primary-900/20",
          text: "text-primary-400",
          border: "border-primary-800/30",
        },
        light: {
          gradient: "from-primary-500 to-primary-600",
          bg: "bg-primary-100",
          text: "text-primary-600",
          border: "border-primary-200",
        },
      },
      indigo: {
        dark: {
          gradient: "from-indigo-700 to-indigo-800",
          bg: "bg-indigo-900/20",
          text: "text-indigo-400",
          border: "border-indigo-800/30",
        },
        light: {
          gradient: "from-indigo-500 to-indigo-600",
          bg: "bg-indigo-100",
          text: "text-indigo-600",
          border: "border-indigo-200",
        },
      },
      teal: {
        dark: {
          gradient: "from-teal-700 to-teal-800",
          bg: "bg-teal-900/20",
          text: "text-teal-400",
          border: "border-teal-800/30",
        },
        light: {
          gradient: "from-teal-500 to-teal-600",
          bg: "bg-teal-100",
          text: "text-teal-600",
          border: "border-teal-200",
        },
      },
    };

    return colorMap[color][theme];
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

  const getCardStyles = () => {
    const baseStyles =
      "rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl";
    const darkStyles =
      "bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 hover:border-neutral-600/70";
    const lightStyles =
      "bg-white/60 border backdrop-blur-lg border-gray-100 hover:border-gray-200";

    return `${baseStyles} ${theme === "dark" ? darkStyles : lightStyles}`;
  };

  const colors = getColorClasses();

  return (
    <div className={getCardStyles()}>
      <div
        className={`bg-gradient-to-r ${colors.gradient} ${compact ? "p-3" : "p-4"}`}
      >
        <div className="flex items-center justify-between text-white">
          {isLoading ? (
            <Skeleton className="h-4 w-24 bg-white/20 dark:bg-white/10" />
          ) : (
            <h3
              className={`${compact ? "text-xs" : "text-sm"
                } font-medium opacity-90`}
            >
              {title}
            </h3>
          )}
          {(typeof Icon === "function" || Icon) && (
            <div
              className={`${compact ? "w-6 h-6" : "w-8 h-8"
                } rounded-lg flex items-center justify-center backdrop-blur-sm bg-white/10`}
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
            <Skeleton className={`mb-2 ${compact ? "h-8 w-20" : "h-10 w-24"}`} />
          ) : (
            <p
              className={`font-bold ${compact ? "text-2xl" : "text-3xl"} ${theme === "dark" ? "text-white" : "text-gray-900"
                } mb-2`}
            >
              {formatValue(value)}
            </p>
          )}

          {isLoading ? (
            <Skeleton className="h-8 w-full rounded-lg" />
          ) : (
            change !== undefined && change !== null && (
              <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getTrendBg()} transition-colors duration-300`}
              >
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {Math.abs(change)}%
                </span>
                <span
                  className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"
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
            >
            </div>
          )}
        </div>
      </div>

      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div
          className={`absolute -inset-1 bg-gradient-to-r ${theme === "dark"
            ? "from-blue-600/5 via-purple-600/3 to-pink-600/5"
            : "from-blue-200/10 via-purple-200/5 to-pink-200/10"
            } blur-xl`}
        ></div>
      </div>
    </div>
  );
};

export default StatCard;
