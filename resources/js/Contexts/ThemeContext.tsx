import axios from "axios";
import { ReactNode, createContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cssPropertiesManager } from "../Utils/CSSCustomPropertiesManager";
import { themeStorage } from "../Utils/ThemeStorage";
import { transitionTheme } from "../Utils/themeTransition";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark"; // El tema real aplicado (resuelve "system")
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme;
  isAuthenticated?: boolean;
  workspaceId?: string | number | null;
}

export function ThemeProvider({
  children,
  initialTheme,
  isAuthenticated = false,
  workspaceId = null,
}: ThemeProviderProps) {
  const { t } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(initialTheme || "system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  const [isInitialized, setIsInitialized] = useState(false);
  const [showThemeToast, setShowThemeToast] = useState(false);

  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const resolveTheme = (themePreference: Theme): "light" | "dark" => {
    if (themePreference === "system") {
      return getSystemTheme();
    }
    return themePreference;
  };

  useEffect(() => {
    const initializeTheme = async () => {
      // Convert workspaceId to string for storage
      const workspaceIdStr = workspaceId ? String(workspaceId) : null;

      // Priority: 1. Workspace-specific preference, 2. initialTheme, 3. system preference
      if (workspaceIdStr) {
        try {
          // Load workspace-specific theme preference
          const workspaceTheme = await themeStorage.loadThemePreference(workspaceIdStr);

          if (workspaceTheme) {
            setThemeState(workspaceTheme);
            setIsInitialized(true);
            return;
          }
        } catch (error) {}
      }

      // Fallback to initialTheme if provided
      if (initialTheme) {
        setThemeState(initialTheme);
        setIsInitialized(true);
        return;
      }

      // Fallback to localStorage (for backward compatibility with non-workspace usage)
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
        setIsInitialized(true);
        return;
      }

      // Default to system preference
      setThemeState("system");
      setIsInitialized(true);
    };

    initializeTheme();
  }, [initialTheme, workspaceId]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized) return;

    const resolved = resolveTheme(theme);
    setActualTheme(resolved);

    const applyTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);

      // Maintain backward compatibility: save to localStorage
      localStorage.setItem("theme", theme);

      // Apply CSS custom properties for the resolved theme
      cssPropertiesManager.applyThemeProperties(resolved);
    };

    // Use enhanced transition with reduced motion support
    // Duration: 250ms (within 200-300ms requirement)
    transitionTheme(applyTheme, {
      duration: 250,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      respectReducedMotion: true,
    });
  }, [theme, isInitialized]);

  // Listen for system theme changes (only when theme is "system")
  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system" || !isInitialized) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const resolved = getSystemTheme();
      setActualTheme(resolved);

      const applySystemTheme = () => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolved);

        // Apply CSS custom properties for the resolved theme
        cssPropertiesManager.applyThemeProperties(resolved);
      };

      // Use enhanced transition with reduced motion support
      // Duration: 250ms (within 200-300ms requirement)
      transitionTheme(applySystemTheme, {
        duration: 250,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        respectReducedMotion: true,
      });
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, isInitialized]);

  // Keyboard shortcut: Ctrl+Alt+T to toggle theme
  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Alt+T (or Cmd+Alt+T on Mac)
      if ((event.ctrlKey || event.metaKey) && event.altKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        toggleTheme();

        // Show toast notification
        setShowThemeToast(true);
        setTimeout(() => setShowThemeToast(false), 2000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInitialized, theme]); // Include theme to ensure toggleTheme has latest state

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Convert workspaceId to string for storage
    const workspaceIdStr = workspaceId ? String(workspaceId) : null;

    // Save to workspace-specific storage if workspace ID is available
    if (workspaceIdStr) {
      try {
        await themeStorage.saveThemePreference(workspaceIdStr, newTheme);
      } catch (error) {}
    } else {
      // Fallback to localStorage for backward compatibility
      localStorage.setItem("theme", newTheme);
    }

    // Sync with backend if authenticated (for user-level preference)
    if (isAuthenticated) {
      try {
        await axios.patch(route("api.v1.profile.theme.update"), {
          theme: newTheme,
        });
      } catch (error) {}
    }
  };

  const toggleTheme = () => {
    // Ciclo: light -> dark -> light (sin system)
    // Si el tema actual es "system", lo convertimos primero al opuesto del actualTheme
    let newTheme: Theme;
    if (theme === "system") {
      // Si está en system, cambiamos al opuesto del tema actual resuelto
      newTheme = actualTheme === "light" ? "dark" : "light";
    } else {
      // Si no está en system, simplemente alternamos
      newTheme = theme === "light" ? "dark" : "light";
    }
    setTheme(newTheme);
  };

  const getThemeLabel = (themeValue: Theme): string => {
    return t(`common.theme.${themeValue}`) || themeValue;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, actualTheme }}>
      {children}

      {/* Theme change toast notification */}
      {showThemeToast && (
        <div
          className="animate-in fade-in slide-in-from-bottom-2 fixed bottom-6 right-6 z-[9999] duration-300"
          style={{
            animation: "slideInUp 0.3s ease-out",
          }}
        >
          <div
            className={`flex min-w-[200px] items-center gap-3 rounded-lg border px-4 py-3 shadow-2xl backdrop-blur-sm ${
              actualTheme === "dark"
                ? "border-neutral-700 bg-neutral-800/95 text-white"
                : "border-gray-200 bg-white/95 text-gray-900"
            } `}
          >
            <div className="flex flex-1 items-center gap-2">
              <span className="text-2xl">
                {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-medium opacity-70">{t("common.theme.changed")}</span>
                <span className="text-sm font-bold">{getThemeLabel(theme)}</span>
              </div>
            </div>
            <kbd
              className={`rounded px-2 py-1 font-mono text-[10px] font-bold ${
                actualTheme === "dark"
                  ? "bg-neutral-700 text-neutral-300"
                  : "bg-gray-100 text-gray-600"
              } `}
            >
              Ctrl+Alt+T
            </kbd>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </ThemeContext.Provider>
  );
}
