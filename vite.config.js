import react from '@vitejs/plugin-react';
import fs from 'fs';
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
        host: 'localhost',
        port: 5173,
        strictPort: true,
        https: !isUsingTunnel && fs.existsSync(keyPath) && fs.existsSync(certPath) ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        } : undefined,
        // hmr: {
        //     host: 'localhost',
        //     protocol: 'ws', 
        //     port: 5173,
        // },
        hmr: true,
        allowedHosts: [
            '.ngrok-free.app',
            '.trycloudflare.com',
        ],
     
    },
});