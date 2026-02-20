import axios from "axios";
import { ReactNode, createContext, useEffect, useState } from "react";
import { cssPropertiesManager } from "../utils/CSSCustomPropertiesManager";
import { transitionTheme, prefersReducedMotion } from "../Utils/themeTransition";
import { themeStorage } from "../Utils/ThemeStorage";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark"; // El tema real aplicado (resuelve "system")
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

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
  const [theme, setThemeState] = useState<Theme>(initialTheme || "system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  const [isInitialized, setIsInitialized] = useState(false);

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
        } catch (error) {
          console.warn('Failed to load workspace theme preference', error);
        }
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

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Convert workspaceId to string for storage
    const workspaceIdStr = workspaceId ? String(workspaceId) : null;

    // Save to workspace-specific storage if workspace ID is available
    if (workspaceIdStr) {
      try {
        await themeStorage.saveThemePreference(workspaceIdStr, newTheme);
      } catch (error) {
        console.error('Failed to save workspace theme preference', error);
      }
    } else {
      // Fallback to localStorage for backward compatibility
      localStorage.setItem("theme", newTheme);
    }

    // Sync with backend if authenticated (for user-level preference)
    if (isAuthenticated) {
      try {
        await axios.patch(route("api.v1.profile.theme.update"), { theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme preference to backend:", error);
      }
    }
  };

  const toggleTheme = () => {
    // Ciclo: light -> dark -> system -> light
    const newTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
