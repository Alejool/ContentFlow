import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import { addDynamicIconSelectors } from "@iconify/tailwind";



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
        primary: {
          100: "#f0f4ff",
          200: "#d9e1ff",
          300: "#a6c1ff",
          400: "#598bff",
          500: "#3366ff",
          600: "#274bdb",
          700: "#1a34b8",
          800: "#102694",
          900: "#091c7a",
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
