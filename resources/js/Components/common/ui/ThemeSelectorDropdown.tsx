import { useTheme } from "@/Hooks/useTheme";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { transitionTheme } from "@/Utils/themeTransition";

type ThemeOption = "light" | "dark" | "system";

export default function ThemeSelectorDropdown() {
  const { theme, setTheme, actualTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeChange = async (newTheme: ThemeOption, e: React.MouseEvent) => {
    if (isAnimating || newTheme === theme) {
      setIsOpen(false);
      return;
    }

    setIsAnimating(true);
    setIsOpen(false);

    try {
      await transitionTheme(() => setTheme(newTheme), e);
    } finally {
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const themeOptions: Array<{
    value: ThemeOption;
    label: string;
    icon: typeof Sun;
    description: string;
  }> = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Bright and clear",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Easy on the eyes",
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow system preference",
    },
  ];

  const currentOption = themeOptions.find((opt) => opt.value === theme);
  const CurrentIcon = currentOption?.icon || Monitor;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isAnimating}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300
          transition-all duration-300 group
          border border-gray-300/50 dark:border-gray-600/50
          bg-gray-100/70 dark:bg-gray-800/70
          hover:bg-gray-200 dark:hover:bg-gray-700
          hover:border-primary-400/50 dark:hover:border-primary-600/50
          shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2 px-3"
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
        <span className="text-sm font-medium">{currentOption?.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            shadow-xl
            overflow-hidden
            z-50
            animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-2 space-y-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={(e) => handleThemeChange(option.value, e)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }
                    group`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-primary-600 dark:text-primary-400" : ""
                    }`}
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs opacity-70">{option.description}</div>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
