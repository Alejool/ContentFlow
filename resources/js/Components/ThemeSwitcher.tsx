import { useTheme } from "@/Hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      toggleTheme();
      setIsAnimating(false);
    }, 200);
  };

  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const nextTheme = isDark ? "Light" : "Dark";

  return (
    <button
      onClick={handleToggle}
      className="relative p-2 rounded-lg hover:bg-gradient-to-br text-gray-600 dark:text-gray-300 hover:text-white
       hover:from-indigo-600 hover:to-purple-800 transition-all duration-500 group overflow-hidden"
      aria-label="Toggle theme"
      title={`Switch to ${nextTheme} mode`}
    >
      <div className="absolute inset-0 transition-all duration-700" />

      <div className="relative flex items-center gap-2">
        <div className="relative w-10 h-10 flex items-center justify-center transition-all duration-500">
          <Icon
            className={`w-7 h-7 transition-all duration-500 ${
              isAnimating
                ? "scale-0 rotate-180"
                : "scale-100 group-hover:rotate-12"
            }`}
          />

          <div
            className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs rounded-full 
              border border-gray-600 dar bg-gradient-to-br shadow-sm transition-all duration-300 ${
                isAnimating ? "scale-0 rotate-90" : "scale-100"
              }`}
          >
            {isDark ? (
              <Sun className="w-3 h-3 " />
            ) : (
              <Moon className="w-3 h-3 " />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
