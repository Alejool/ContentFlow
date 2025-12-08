import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import { addDynamicIconSelectors } from "@iconify/tailwind";
import { theme } from './resources/js/theme.ts';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
    "./storage/framework/views/*.php",
    "./resources/views/**/*.blade.php",
    "./resources/js/**/*.tsx",
  ],

  theme: {
    extend: {
      colors: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        black: theme.colors.black,
        neutral: theme.colors.neutral,
        success: theme.colors.success,
        error: theme.colors.error,
        warning: theme.colors.warning,
        info: theme.colors.info,
        
        red: theme.colors.primary, 
        orange: theme.colors.primary,
        blue: theme.colors.accent.blue,
        purple: theme.colors.accent.purple,
        green: theme.colors.accent.green,
        yellow: theme.colors.accent.yellow,
        pink: theme.colors.accent.pink,
        gray: theme.colors.gray,
        
        beige: {
          50: theme.colors.secondary[50],
          100: theme.colors.secondary[100],
          200: theme.colors.secondary[200], 
          300: theme.colors.secondary[300], 
          400: theme.colors.secondary[400],
          500: theme.colors.secondary[500],
        },
        
        accent: {
          blue: theme.colors.accent.blue,
          purple: theme.colors.accent.purple,
          green: theme.colors.accent.green,
          yellow: theme.colors.accent.yellow,
          pink: theme.colors.accent.pink,
        },
      },
      
      backgroundImage: {
        'gradient-primary': theme.gradients.primary,
        'gradient-secondary': theme.gradients.secondary,
        'gradient-accent': theme.gradients.accent,
        'gradient-dark': theme.gradients.dark,
        'gradient-light': theme.gradients.light,
        'gradient-warm': theme.gradients.warm,
        'gradient-cool': theme.gradients.cool,
      },
      
      fontFamily: {
        heading: ["Poppins", ...defaultTheme.fontFamily.sans],
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        poppins: ["Poppins", ...defaultTheme.fontFamily.sans],
        inter: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Poppins", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },
      
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
    },
  },

  plugins: [forms, addDynamicIconSelectors()],
};