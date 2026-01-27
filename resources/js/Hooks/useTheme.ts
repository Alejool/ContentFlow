import { useContext } from "react";
import { ThemeContext } from "@/Contexts/ThemeContext";

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    return {
      theme: 'light',
      setTheme: () => {},
      isDark: false,
    };
  }

  return context;
}
