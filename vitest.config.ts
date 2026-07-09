/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/Javascript/setup.ts",
    include: ["tests/Javascript/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./resources/js"),
      "@Components": path.resolve(__dirname, "./resources/js/Components"),
      "@Hooks": path.resolve(__dirname, "./resources/js/Hooks"),
      "@Utils": path.resolve(__dirname, "./resources/js/Utils"),
      "@assets": path.resolve(__dirname, "./resources/assets"),
    },
  },
});
