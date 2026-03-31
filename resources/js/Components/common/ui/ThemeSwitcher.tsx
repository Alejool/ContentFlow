import { useTheme } from '@/Hooks/useTheme';
import { transitionTheme } from '@/Utils/themeTransition';
import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

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
    if (theme === 'system') {
      return {
        Icon: Monitor,
        NextIcon: actualTheme === 'dark' ? Sun : Moon,
        nextTheme: 'Light',
        label: 'System',
      };
    }
    const isDark = theme === 'dark';
    return {
      Icon: isDark ? Moon : Sun,
      NextIcon: isDark ? Monitor : Moon,
      nextTheme: isDark ? 'System' : 'Dark',
      label: isDark ? 'Dark' : 'Light',
    };
  };

  const { Icon, NextIcon, nextTheme, label } = getThemeInfo();

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group relative overflow-hidden rounded-lg border border-gray-200/30 bg-white/60 p-2 backdrop-blur-md transition-all duration-300 hover:border-primary-200/40 hover:bg-white/70 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700/30 dark:bg-neutral-800/40 dark:hover:border-primary-500/20 dark:hover:bg-neutral-800/60"
      aria-label={`Toggle theme (current: ${label})`}
      title={`Switch to ${nextTheme} mode`}
      disabled={isAnimating}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Icon className="h-5 w-5 text-gray-700 transition-all duration-300 group-hover:scale-110 dark:text-gray-300" />
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200/40 bg-white/80 shadow-md backdrop-blur-sm transition-all duration-300 dark:border-neutral-600/40 dark:bg-neutral-800/80 ${
            isAnimating ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <NextIcon className="h-2.5 w-2.5 text-gray-600 dark:text-gray-400" />
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 1 }}
          className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-500 dark:bg-primary-400"
        />
      </div>
    </motion.button>
  );
}
