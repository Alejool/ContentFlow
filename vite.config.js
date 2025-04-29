import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tsconfigPaths from "vite-tsconfig-paths"


export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
                'resources/js/firebase.js',
            ],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),   
        react(),
        tsconfigPaths(),
    ],
      optimizeDeps: {
    include: ['@ffmpeg/ffmpeg'], // Asegúrate de incluir la biblioteca
  },
   server: {
        proxy: {
            '*': {
                target: 'http://127.0.0.1:8000', // URL del backend
                changeOrigin: true,
                secure: true,
            },
        },
        // cors: true,
    },
});
