import { useContext } from "react";
import { ThemeContext } from "@/Contexts/ThemeContext";

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    return {
      theme: 'light' as const,
      setTheme: () => {},
      toggleTheme: () => {},
      actualTheme: 'light' as const,
      isDark: false,
    };
  }

  return {
    ...context,
    isDark: context.actualTheme === 'dark',
  };
}
