import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

const host = 'localhost';
const certPath = './localhost.pem';
const keyPath = './localhost-key.pem';

const isUsingTunnel = process.env.VITE_TUNNEL_URL !== undefined;

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
                'resources/js/bootstrap.ts',
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
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,

        hmr: {
            host: process.env.VITE_HMR_HOST || 'localhost',
            clientPort: 5173,
            protocol: 'ws',
            timeout: 60000,
        },

        watch: {
            usePolling: true,
            interval: 1000,
        },

        cors: true,

        allowedHosts: [
            'localhost',
            'leviathan-port.tail4af8a1.ts.net',
            '127.0.0.1',
            '.ngrok-free.app',
            '.trycloudflare.com',
        ],
    },
});