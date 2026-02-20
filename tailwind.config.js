import defaultTheme from 'tailwindcss/defaultTheme.js';
import forms from '@tailwindcss/forms';
import { addDynamicIconSelectors } from "@iconify/tailwind";
import { theme, enhancedTheme } from './resources/js/theme.ts';
import plugin from 'tailwindcss/plugin.js';

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
        white: theme.colors.white,

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

        // Enhanced theme colors for dark/light modes
        'theme-bg': {
          primary: 'var(--theme-bg-primary)',
          secondary: 'var(--theme-bg-secondary)',
          tertiary: 'var(--theme-bg-tertiary)',
          elevated: 'var(--theme-bg-elevated)',
        },
        'theme-text': {
          primary: 'var(--theme-text-primary)',
          secondary: 'var(--theme-text-secondary)',
          tertiary: 'var(--theme-text-tertiary)',
          disabled: 'var(--theme-text-disabled)',
        },
        'theme-border': {
          subtle: 'var(--theme-border-subtle)',
          default: 'var(--theme-border-default)',
          strong: 'var(--theme-border-strong)',
        },
        'theme-interactive': {
          hover: 'var(--theme-interactive-hover)',
          active: 'var(--theme-interactive-active)',
          focus: 'var(--theme-interactive-focus)',
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
      
      // Enhanced animation timing from enhancedTheme
      transitionDuration: {
        'instant': '0ms',
        'fast': `${enhancedTheme.animation.duration.fast}ms`,
        'normal': `${enhancedTheme.animation.duration.normal}ms`,
        'slow': `${enhancedTheme.animation.duration.slow}ms`,
        'slower': `${enhancedTheme.animation.duration.slower}ms`,
      },
      
      transitionTimingFunction: {
        'ease-in-out': enhancedTheme.animation.easing.easeInOut,
        'ease-out': enhancedTheme.animation.easing.easeOut,
        'ease-in': enhancedTheme.animation.easing.easeIn,
        'spring': enhancedTheme.animation.easing.spring,
      },
      
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-in': 'fade-in 0.25s ease-in-out',
        'slide-in': 'slide-in 0.25s ease-in-out',
        'scale-in': 'scale-in 0.25s ease-in-out',
      },
      
      // Focus ring utilities
      ringWidth: {
        'focus': enhancedTheme.focus.ring.width,
      },
      ringOffsetWidth: {
        'focus': enhancedTheme.focus.ring.offset,
      },
    },
  },

  plugins: [
    forms, 
    addDynamicIconSelectors(),
    
    // Custom plugin for focus styles and accessibility utilities
    plugin(function({ addUtilities, addComponents, theme }) {
      // Enhanced focus utilities
      addUtilities({
        '.focus-ring': {
          '&:focus-visible': {
            outline: `${enhancedTheme.focus.ring.width} ${enhancedTheme.focus.ring.style} var(--theme-focus-ring-color)`,
            outlineOffset: enhancedTheme.focus.ring.offset,
          },
        },
        '.focus-ring-inset': {
          '&:focus-visible': {
            outline: `${enhancedTheme.focus.ring.width} ${enhancedTheme.focus.ring.style} var(--theme-focus-ring-color)`,
            outlineOffset: '0',
          },
        },
        '.focus-outline': {
          '&:focus-visible': {
            outline: `${enhancedTheme.focus.outline.width} ${enhancedTheme.focus.outline.style} var(--theme-focus-outline-color)`,
          },
        },
      });

      // Accessibility utilities
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
        '.sr-only-focusable': {
          '&:focus, &:active': {
            position: 'static',
            width: 'auto',
            height: 'auto',
            padding: 'inherit',
            margin: 'inherit',
            overflow: 'visible',
            clip: 'auto',
            whiteSpace: 'normal',
          },
        },
        '.skip-link': {
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          '&:focus': {
            position: 'fixed',
            top: '0',
            left: '0',
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
            zIndex: '9999',
            padding: '1rem',
            backgroundColor: theme('colors.primary.500'),
            color: theme('colors.white'),
            textDecoration: 'none',
            borderRadius: theme('borderRadius.md'),
          },
        },
      });

      // Motion utilities for reduced motion support
      addUtilities({
        '.motion-safe': {
          '@media (prefers-reduced-motion: no-preference)': {
            // Animations enabled
          },
        },
        '.motion-reduce': {
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none !important',
            transition: 'none !important',
          },
        },
      });

      // Interactive state utilities
      addComponents({
        '.interactive-hover': {
          transition: `all ${enhancedTheme.animation.duration.fast}ms ${enhancedTheme.animation.easing.easeInOut}`,
          '&:hover': {
            backgroundColor: 'var(--theme-interactive-hover)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
          },
        },
        '.interactive-active': {
          '&:active': {
            backgroundColor: 'var(--theme-interactive-active)',
          },
        },
        '.interactive-focus': {
          '&:focus-visible': {
            backgroundColor: 'var(--theme-interactive-focus)',
            outline: `${enhancedTheme.focus.ring.width} ${enhancedTheme.focus.ring.style} var(--theme-focus-ring-color)`,
            outlineOffset: enhancedTheme.focus.ring.offset,
          },
        },
      });
    }),
  ],
};