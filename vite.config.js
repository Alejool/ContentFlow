import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),   
        react(),
    ],
      optimizeDeps: {
    include: ['@ffmpeg/ffmpeg'], // Asegúrate de incluir la biblioteca
  },
   server: {
        proxy: {
            '/videos': {
                target: 'http://127.0.0.1:8000', // URL del backend
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
