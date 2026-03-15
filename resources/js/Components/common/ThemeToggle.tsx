/**
 * Enhanced Theme Toggle Component
 *
 * Accessible theme switcher with animations and keyboard support
 */

import React from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useTheme } from "@/Hooks/useTheme";
import { useReducedMotion } from "@/Hooks/useReducedMotion";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  const reducedMotion = useReducedMotion();

  const themes = [
    { value: "light", label: "Claro", icon: "☀️" },
    { value: "dark", label: "Oscuro", icon: "🌙" },
    { value: "system", label: "Sistema", icon: "💻" },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Seleccionar tema"
      className="inline-flex items-center gap-1 rounded-lg border border-theme-border-default bg-theme-bg-secondary p-1"
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
            className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast focus-ring ${
              isActive
                ? "text-theme-text-primary"
                : "text-theme-text-tertiary hover:text-theme-text-secondary"
            } `}
          >
            {isActive && (
              <LazyMotion features={domAnimation}>
                <m.div
                  layoutId="theme-toggle-bg"
                  className="absolute inset-0 rounded-md border border-theme-border-default bg-theme-bg-elevated shadow-sm"
                  initial={false}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 500, damping: 30 }
                  }
                />
              </LazyMotion>
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
