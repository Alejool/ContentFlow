import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tsconfigPaths from "vite-tsconfig-paths"


export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
                'resources/js/firebase.ts',
            ],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),   
        react(),
        tsconfigPaths(),
    ],
    optimizeDeps: {
        include: ['@ffmpeg/ffmpeg'],
    },
    server: {
        proxy: {
            '*': {
                target: 'http://127.0.0.1:8000', 
                changeOrigin: true,
                secure: true,
            },
        },
        allowedHosts: ['eebd-2a09-bac5-26fc-aa-00-11-181.ngrok-free.app'],
        // cors: true,
    },
});
