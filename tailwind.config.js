import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import { addDynamicIconSelectors } from "@iconify/tailwind";
import { theme } from './resources/js/theme.ts';



/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
    "./storage/framework/views/*.php",
    "./resources/views/**/*.blade.php",
    "./resources/js/**/*.jsx",
    "./resources/js/**/*.tsx",
  ],

  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        
        // Semantic colors
        success: theme.colors.success,
        error: theme.colors.error,
        warning: theme.colors.warning,
        info: theme.colors.info,
        
        // Map Tailwind default color names to theme colors
        red: theme.colors.primary,
        orange: theme.colors.secondary,
        blue: theme.colors.accent.blue,
        purple: theme.colors.accent.purple,
        green: theme.colors.accent.green,
        yellow: theme.colors.accent.yellow,
        pink: theme.colors.accent.pink,
        indigo: theme.colors.accent.indigo,
        gray: theme.colors.gray,
        
        // Accent colors (also accessible via accent.blue, etc.)
        accent: {
          blue: theme.colors.accent.blue,
          purple: theme.colors.accent.purple,
          green: theme.colors.accent.green,
          yellow: theme.colors.accent.yellow,
          pink: theme.colors.accent.pink,
          indigo: theme.colors.accent.indigo,
        },
        gradient: {
          primary: theme.gradients.primary,
          secondary: theme.gradients.secondary,
        },
      },
      fontFamily: {
        sans: ["Figtree", ...defaultTheme.fontFamily.sans],
        poppins: ["Poppins", ...defaultTheme.fontFamily.sans],
      },
    },
  },

  plugins: [ addDynamicIconSelectors()],
};
