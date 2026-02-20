/**
 * Enhanced Theme Toggle Component
 * 
 * Accessible theme switcher with animations and keyboard support
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/Hooks/useTheme';
import { useReducedMotion } from '@/Hooks/useReducedMotion';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  const reducedMotion = useReducedMotion();

  const themes = [
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Oscuro', icon: '🌙' },
    { value: 'system', label: 'Sistema', icon: '💻' },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Seleccionar tema"
      className="inline-flex items-center gap-1 p-1 bg-theme-bg-secondary rounded-lg border border-theme-border-default"
    >
      {themes.map(({ value, label, icon }) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={`Tema ${label}`}
            onClick={() => setTheme(value)}
            className={`
              relative px-3 py-2 rounded-md
              text-sm font-medium
              transition-colors duration-fast
              focus-ring
              ${
                isActive
                  ? 'text-theme-text-primary'
                  : 'text-theme-text-tertiary hover:text-theme-text-secondary'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="theme-toggle-bg"
                className="absolute inset-0 bg-theme-bg-elevated rounded-md shadow-sm border border-theme-border-default"
                initial={false}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 500, damping: 30 }
                }
              />
            )}
            
            <span className="relative flex items-center gap-2">
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
