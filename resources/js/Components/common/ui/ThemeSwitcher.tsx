import { useTheme } from "@/Hooks/useTheme";
import { Moon, Sun, ChevronRight } from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    if (isAnimating) return;

    const x = e.clientX;
    const y = e.clientY;

    setIsAnimating(true);

    const performToggle = () => {
      toggleTheme();
      setTimeout(() => setIsAnimating(false), 300);
    };
    if (!(document as any).startViewTransition) {
      performToggle();
      return;
    }
    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);
    document.documentElement.setAttribute("data-theme-transition", "true");

    const transition = (document as any).startViewTransition(async () => {
      flushSync(() => {
        toggleTheme();
      });
    });

    transition.finished.finally(() => {
      document.documentElement.removeAttribute("data-theme-transition");
      setIsAnimating(false);
    });
  };

  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const NextIcon = isDark ? Moon : Sun;
  const nextTheme = isDark ? "Light" : "Dark";

  return (
    <button
      onClick={handleToggle}
      className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300
       transition-all duration-300 group
       border border-gray-300/50 dark:border-gray-600/50
       bg-gray-100/70 dark:bg-gray-800/70
       hover:bg-gray-200 dark:hover:bg-gray-700
       hover:border-primary-400/50 dark:hover:border-primary-600/50
       shadow-sm hover:shadow-md"
      aria-label="Toggle theme"
      title={`Switch to ${nextTheme} mode`}
    >
      <div className="relative w-10 h-10 flex items-center justify-center">
        <Icon
          className={`w-6 h-6 transition-all duration-300 ${isAnimating
            ? "scale-0 rotate-180 opacity-0"
            : "scale-100 group-hover:scale-110 opacity-100"
            }`}
        />

        <div
          className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full 
            bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900
            border border-gray-300 dark:border-gray-600 
            shadow transition-all duration-300 ${isAnimating
              ? "scale-0 -rotate-90 opacity-0"
              : "scale-100 opacity-100 group-hover:scale-110"
            }`}
        >
          <NextIcon className="w-3 h-3 text-gray-700 dark:text-gray-300" />
        </div>

        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full 
          bg-primary-500 dark:bg-primary-400 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </button>
  );
}
