import axios from "axios";
import { ReactNode, createContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: Theme; // Prop opcional para el tema inicial
  isAuthenticated?: boolean;
}

export function ThemeProvider({
  children,
  initialTheme,
  isAuthenticated = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme || "light");

  // Inicializar el tema solo en el cliente
  useEffect(() => {
    const initializeTheme = () => {
      // Priority if authenticated: 1. initialTheme (from DB), 2. localStorage, 3. system preference
      if (isAuthenticated && initialTheme) {
        setThemeState(initialTheme);
        return;
      }

      // Priority if guest: 1. localStorage, 2. initialTheme prop, 3. system preference
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        return;
      }

      // Si tenemos initialTheme, usarlo
      if (initialTheme) {
        setThemeState(initialTheme);
        return;
      }

      // Detect system preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
        return;
      }

      setThemeState("light");
    };

    initializeTheme();
  }, [initialTheme, isAuthenticated]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      const stored = localStorage.getItem("theme");
      if (!stored) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    // Solo sincronizar con el backend si está autenticado
    if (isAuthenticated) {
      try {
        await axios.patch("/theme", { theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme preference:", error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
