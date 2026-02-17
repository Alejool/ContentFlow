import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

const host = process.env.VITE_HMR_HOST || 'leviathan.tail4af8a1.ts.net';
const certPath = './localhost.pem';
const keyPath = './localhost-key.pem';
const isProduction = process.env.NODE_ENV === 'production';

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
            devServer: {
                host: '0.0.0.0',
            },
        }),
        react(),
        tsconfigPaths(),
    ],
    optimizeDeps: {
        include: ['@ffmpeg/ffmpeg'],
    },
    server: isProduction ? {} : {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,

        hmr: {
            host: host,
            clientPort: 5173,
            protocol: 'ws',
            timeout: 60000,
        },

        watch: {
            usePolling: true,
            interval: 1000,
            ignored: [
                '**/vendor/**',
                '**/storage/**',
                '**/docker/**',
                '**/node_modules/**',
            ],
        },

        cors: true,

        allowedHosts: [
            'localhost',
            'leviathan-port.tail4af8a1.ts.net',
            'leviathan.tail4af8a1.ts.net',
            '100.125.246.50',
            '127.0.0.1',
            '.ngrok-free.app',
            '.trycloudflare.com',
        ],
    },
});
