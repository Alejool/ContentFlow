import { useTheme } from "@/Hooks/useTheme";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";
import { transitionTheme } from "@/Utils/themeTransition";

export default function ThemeSwitcher() {
  const { theme, toggleTheme, actualTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    if (isAnimating) return;

    setIsAnimating(true);

    try {
      await transitionTheme(() => toggleTheme(), e);
    } finally {
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const getThemeInfo = () => {
    if (theme === "system") {
      return {
        Icon: Monitor,
        NextIcon: actualTheme === "dark" ? Sun : Moon,
        nextTheme: "Light",
        label: "System",
      };
    }
    const isDark = theme === "dark";
    return {
      Icon: isDark ? Moon : Sun,
      NextIcon: isDark ? Monitor : Moon,
      nextTheme: isDark ? "System" : "Dark",
      label: isDark ? "Dark" : "Light",
    };
  };

  const { Icon, NextIcon, nextTheme, label } = getThemeInfo();

  return (
    <button
      onClick={handleToggle}
      className="group relative rounded-lg border border-gray-300/50 bg-gray-100/70 p-2 text-gray-600 shadow-sm transition-all duration-300 hover:border-primary-400/50 hover:bg-gray-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600/50 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:border-primary-600/50 dark:hover:bg-gray-700"
      aria-label={`Toggle theme (current: ${label})`}
      title={`Switch to ${nextTheme} mode`}
      disabled={isAnimating}
    >
      <div className="relative flex h-10 w-10 items-center justify-center">
        <Icon
          className={`h-6 w-6 transition-all duration-500 ease-out ${
            isAnimating
              ? "rotate-180 scale-0 opacity-0"
              : "scale-100 opacity-100 group-hover:rotate-12 group-hover:scale-110"
          }`}
        />

        <div
          className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm transition-all duration-500 ease-out dark:border-gray-600 dark:from-gray-800 dark:to-gray-900 ${
            isAnimating
              ? "-rotate-90 scale-0 opacity-0"
              : "scale-100 opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110"
          }`}
        >
          <NextIcon className="h-3 w-3 text-gray-700 dark:text-gray-300" />
        </div>

        <div className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-500 opacity-0 transition-all duration-300 group-hover:animate-pulse group-hover:opacity-100 dark:bg-primary-400" />
      </div>
    </button>
  );
}
