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
      className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300
       transition-all duration-300 group
       border border-gray-300/50 dark:border-gray-600/50
       bg-gray-100/70 dark:bg-gray-800/70
       hover:bg-gray-200 dark:hover:bg-gray-700
       hover:border-primary-400/50 dark:hover:border-primary-600/50
       shadow-sm hover:shadow-md
       disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={`Toggle theme (current: ${label})`}
      title={`Switch to ${nextTheme} mode`}
      disabled={isAnimating}
    >
      <div className="relative w-10 h-10 flex items-center justify-center">
        <Icon
          className={`w-6 h-6 transition-all duration-500 ease-out ${
            isAnimating
              ? "scale-0 rotate-180 opacity-0"
              : "scale-100 group-hover:scale-110 group-hover:rotate-12 opacity-100"
          }`}
        />

        <div
          className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full 
            bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900
            border border-gray-300 dark:border-gray-600 
            shadow-sm transition-all duration-500 ease-out ${
              isAnimating
                ? "scale-0 -rotate-90 opacity-0"
                : "scale-100 opacity-100 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            }`}
        >
          <NextIcon className="w-3 h-3 text-gray-700 dark:text-gray-300" />
        </div>

        <div
          className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full 
          bg-primary-500 dark:bg-primary-400 
          opacity-0 group-hover:opacity-100 transition-all duration-300
          group-hover:animate-pulse"
        />
      </div>
    </button>
  );
}
