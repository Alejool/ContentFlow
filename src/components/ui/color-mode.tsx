"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

export interface ColorModeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
}

// Context for the theme
const ThemeContext = React.createContext<{
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}>({
  theme: "light",
  setTheme: () => {},
});

// Hook to use the theme context
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Simplified provider
export function ColorModeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  disableTransitionOnChange = false,
  storageKey = "theme",
}: ColorModeProviderProps) {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">(
    () => {
      if (typeof window === "undefined")
        return defaultTheme as "light" | "dark" | "system";

      const stored = localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }

      // Detect system preference
      if (defaultTheme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      return defaultTheme as "light" | "dark" | "system";
    }
  );

  const setTheme = React.useCallback(
    (newTheme: "light" | "dark" | "system") => {
      setThemeState(newTheme);

      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, newTheme);

        const root = document.documentElement;
        const actualTheme =
          newTheme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : newTheme;

        if (disableTransitionOnChange) {
          const css = document.createElement("style");
          css.appendChild(
            document.createTextNode(
              `*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
            )
          );
          document.head.appendChild(css);

          root.classList.remove("light", "dark");
          root.classList.add(actualTheme);

          const _ = window.getComputedStyle(css).opacity;
          document.head.removeChild(css);
        } else {
          root.classList.remove("light", "dark");
          root.classList.add(actualTheme);
        }
      }
    },
    [disableTransitionOnChange, storageKey]
  );

  // Effect to apply the theme on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const actualTheme =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;

      root.classList.remove("light", "dark");
      root.classList.add(actualTheme);
      root.setAttribute(attribute, actualTheme);
    }
  }, [theme, attribute]);

  // Listen to system preference changes
  React.useEffect(() => {
    if (theme === "system" && typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = () => {
        const root = document.documentElement;
        const actualTheme = mediaQuery.matches ? "dark" : "light";

        root.classList.remove("light", "dark");
        root.classList.add(actualTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

// Main hook for color mode
export function useColorMode(): UseColorModeReturn {
  const { theme, setTheme } = useTheme();

  const toggleColorMode = React.useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme, setTheme]);

  const resolvedTheme = React.useMemo(() => {
    if (theme === "system" && typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme as ColorMode;
  }, [theme]);

  return {
    colorMode: resolvedTheme,
    setColorMode: (colorMode: ColorMode) => setTheme(colorMode),
    toggleColorMode,
  };
}

// Hook for theme-dependent values
export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}

// Icon that changes according to the theme
export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? (
    <Moon className="w-5 h-5" />
  ) : (
    <Sun className="w-5 h-5" />
  );
}

// Props for the color mode button
interface ColorModeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "solid" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  iconSize?: "sm" | "md" | "lg";
}

// Theme change button
export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(
  {
    variant = "ghost",
    size = "sm",
    isLoading = false,
    iconSize,
    className = "",
    ...props
  },
  ref
) {
  const { toggleColorMode, colorMode } = useColorMode();

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const iconSizeMap = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSizeClass = iconSize
    ? iconSizeMap[iconSize]
    : size === "sm"
    ? "w-4 h-4"
    : size === "md"
    ? "w-5 h-5"
    : "w-6 h-6";

  const variantClasses = {
    ghost:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
    solid:
      colorMode === "dark"
        ? "bg-gray-800 text-amber-400 hover:bg-gray-700"
        : "bg-gray-100 text-amber-600 hover:bg-gray-200",
    outline:
      "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
  };

  return (
    <button
      ref={ref}
      onClick={toggleColorMode}
      aria-label={`Switch to ${colorMode === "dark" ? "light" : "dark"} mode`}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center rounded-lg transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
        dark:focus:ring-offset-gray-900
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <div
          className={`${iconSizeClass} border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin`}
        />
      ) : colorMode === "dark" ? (
        <Sun
          className={`${iconSizeClass} transition-transform duration-300 hover:rotate-12`}
        />
      ) : (
        <Moon
          className={`${iconSizeClass} transition-transform duration-300 hover:rotate-12`}
        />
      )}
    </button>
  );
});

// Version with skeleton for SSR
export const ColorModeButtonWithSkeleton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButtonWithSkeleton(props, ref) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${
          props.className || ""
        }`}
        aria-hidden="true"
      />
    );
  }

  return <ColorModeButton ref={ref} {...props} />;
});

// Components for theme-specific content
interface ThemeContentProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
}

export const LightMode = React.forwardRef<HTMLSpanElement, ThemeContentProps>(
  function LightMode({ children, className = "", ...props }, ref) {
    const { colorMode } = useColorMode();

    if (colorMode !== "light") return null;

    return (
      <span ref={ref} className={`theme-light ${className}`} {...props}>
        {children}
      </span>
    );
  }
);

export const DarkMode = React.forwardRef<HTMLSpanElement, ThemeContentProps>(
  function DarkMode({ children, className = "", ...props }, ref) {
    const { colorMode } = useColorMode();

    if (colorMode !== "dark") return null;

    return (
      <span ref={ref} className={`theme-dark ${className}`} {...props}>
        {children}
      </span>
    );
  }
);

// Hook to detect if we are on the client
export function useIsClient() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

// Componente ClientOnly wrapper
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isClient = useIsClient();
  return isClient ? <>{children}</> : <>{fallback}</>;
}

// Simplified version of ThemeProvider with SSR support
export function SimpleThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevents content flash
  if (!mounted) {
    return (
      <div
        className="min-h-screen bg-white dark:bg-gray-900"
        style={{ visibility: "hidden" }}
        suppressHydrationWarning
      >
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

// Hook to get the current color mode safely
export function useSafeColorMode() {
  const isClient = useIsClient();
  const { colorMode, setColorMode, toggleColorMode } = useColorMode();

  return {
    colorMode: isClient ? colorMode : ("light" as ColorMode),
    setColorMode: isClient ? setColorMode : () => {},
    toggleColorMode: isClient ? toggleColorMode : () => {},
    isClient,
  };
}
