export const theme = {
  colors: {
    primary: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#FF6D1F", 
      700: "#ea580c",
      800: "#c2410c",
      900: "#9a3412",
    },

    secondary: {
      50: "#fefaf6",
      100: "#fdf6f0",
      200: "#FAF3E1",
      300: "#f5e7c6", 
      400: "#f0dbb0",
      500: "#ebcf9a",
      600: "#e6c384",
      700: "#e1b76e",
      800: "#dcab58",
      900: "#d79f42",
    },

    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },

    black: "#222222", 
    white: "#ffffff",

    accent: {
      blue: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
      },
      purple: {
        50: "#faf5ff",
        100: "#f3e8ff",
        500: "#a855f7",
        600: "#9333ea",
        700: "#7e22ce",
      },
      green: {
        50: "#f0fdf4",
        100: "#dcfce7",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
      },
      yellow: {
        50: "#fefce8",
        100: "#fef9c3",
        500: "#eab308",
        600: "#ca8a04",
        700: "#a16207",
      },
      pink: {
        50: "#fdf2f8",
        100: "#fce7f3",
        500: "#ec4899",
        600: "#db2777",
        700: "#be185d",
      },
    },

    gray: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },

    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
    },

    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
    },

    warning: {
      50: "#fff7ed",
      100: "#ffedd5",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
    },

    info: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
  },

  gradients: {
    primary: "linear-gradient(to right, #FF6D1F, #f97316)", 
    secondary: "linear-gradient(to right, #FAF3E1, #f5e7c6)", 
    accent: "linear-gradient(to right, #FF6D1F, #f97316, #fb923c)", 
    dark: "linear-gradient(to right, #222222, #404040)", 
    light: "linear-gradient(to right, #FAF3E1, #ffffff, #FAF3E1)",
    warm: "linear-gradient(to right, #FAF3E1, #FF6D1F)", 
    cool: "linear-gradient(to right, #FAF3E1, #3b82f6)", 
  },

  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },

    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },

    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },

    lineHeight: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
  },

  spacing: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
  },

  borderRadius: {
    none: "0",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  },

  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    slower: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  zIndex: {
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50",
    auto: "auto",
  },

  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

export const getGradient = (type: keyof typeof theme.gradients) =>
  theme.gradients[type];
export const getColor = (color: string) => {
  const parts = color.split(".");
  let value: any = theme.colors;
  for (const part of parts) {
    value = value[part];
  }
  return value;
};

export type Theme = typeof theme;
export default theme;
