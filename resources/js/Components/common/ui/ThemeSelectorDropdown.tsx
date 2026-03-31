import { useTheme } from '@/Hooks/useTheme';
import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { transitionTheme } from '@/Utils/themeTransition';

type ThemeOption = 'light' | 'dark' | 'system';

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
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Bright and clear',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Easy on the eyes',
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference',
    },
  ];

  const currentOption = themeOptions.find((opt) => opt.value === theme);
  const CurrentIcon = currentOption?.icon || Monitor;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isAnimating}
        className="group relative flex items-center gap-2 rounded-lg border border-gray-300/50 bg-gray-100/70 p-2 px-3 text-gray-600 shadow-sm transition-all duration-300 hover:border-primary-400/50 hover:bg-gray-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600/50 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:border-primary-600/50 dark:hover:bg-gray-700"
        aria-label="Select theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        <span className="text-sm font-medium">{currentOption?.label}</span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl duration-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-1 p-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={(e) => handleThemeChange(option.value, e)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  } group`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-primary-600 dark:text-primary-400' : ''
                    }`}
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs opacity-70">{option.description}</div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
