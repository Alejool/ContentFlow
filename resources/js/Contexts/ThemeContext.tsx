import axios from "axios";
import { ReactNode, createContext, useEffect, useState } from "react";

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
}

export function ThemeProvider({
  children,
  initialTheme,
  isAuthenticated = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme || "system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

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
    const initializeTheme = () => {
      // Priority if authenticated: 1. initialTheme (from DB), 2. localStorage, 3. system preference
      if (isAuthenticated && initialTheme) {
        setThemeState(initialTheme);
        return;
      }

      // Priority if guest: 1. localStorage, 2. initialTheme prop, 3. system preference
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
        return;
      }

      // Si tenemos initialTheme, usarlo
      if (initialTheme) {
        setThemeState(initialTheme);
        return;
      }

      // Default to system
      setThemeState("system");
    };

    initializeTheme();
  }, [initialTheme, isAuthenticated]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resolved = resolveTheme(theme);
    setActualTheme(resolved);

    const root = window.document.documentElement;
    
    // Aplicar transición suave
    root.style.setProperty('transition', 'background-color 0.3s ease-in-out, color 0.3s ease-in-out');
    
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    localStorage.setItem("theme", theme);
    
    // Limpiar la transición después de aplicarla
    setTimeout(() => {
      root.style.removeProperty('transition');
    }, 300);
  }, [theme]);

  // Listen for system theme changes (only when theme is "system")
  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const resolved = getSystemTheme();
      setActualTheme(resolved);
      const root = window.document.documentElement;
      
      // Aplicar transición suave
      root.style.setProperty('transition', 'background-color 0.3s ease-in-out, color 0.3s ease-in-out');
      
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      
      // Limpiar la transición después de aplicarla
      setTimeout(() => {
        root.style.removeProperty('transition');
      }, 300);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Solo sincronizar con el backend si está autenticado
    if (isAuthenticated) {
      try {
        await axios.patch(route("api.v1.profile.theme.update"), { theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme preference:", error);
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
