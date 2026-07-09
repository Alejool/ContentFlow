import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from "vite-tsconfig-paths";

const host = process.env.VITE_HMR_HOST || 'localhost';
const certPath = './localhost.pem';
const keyPath = './localhost-key.pem';
const isProduction = process.env.NODE_ENV === 'production';

const isUsingTunnel = process.env.VITE_TUNNEL_URL !== undefined;

export default defineConfig({
    plugins: [
        tailwindcss(),
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
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            manifest: {
                name: 'Social Content Manager',
                short_name: 'ContentMgr',
                description: 'Gestión de publicaciones y contenido social',
                theme_color: '#c96b2cff',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                scope: '/',
                categories: ['productivity', 'social'],
                icons: [
                    {
                        src: '/icons/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/favicon.ico',
                        sizes: '32x32',
                        type: 'image/x-icon'
                    }
                ],
                screenshots: [
                    {
                        src: '/screenshots/desktop.svg',
                        sizes: '1280x720',
                        type: 'image/svg+xml',
                        form_factor: 'wide'
                    },
                    {
                        src: '/screenshots/mobile.svg',
                        sizes: '750x1334',
                        type: 'image/svg+xml',
                        form_factor: 'narrow'
                    }
                ]
            },
            workbox: {
                globDirectory: 'public/build',
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        urlPattern: /\/_next\/static\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-assets-cache',
                            expiration: {
                                maxEntries: 150,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https?:\/\/.*\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 12
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 60 * 60 * 24 * 7
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'font-cache',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\/(publications|reels|calendar)\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'dynamic-content-cache',
                            networkTimeoutSeconds: 3,
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 30
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            },
            devOptions: {
                enabled: false
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            '@Components': path.resolve(__dirname, 'resources/js/Components'),
            '@Hooks': path.resolve(__dirname, 'resources/js/Hooks'),
            '@Utils': path.resolve(__dirname, 'resources/js/Utils'),
            '@assets': path.resolve(__dirname, 'resources/assets'),
        },
    },
    optimizeDeps: {
        // Pre-bundlear todas las deps usadas en el critical path.
        // Con el volumen cf_vite_cache persistente, esto solo corre UNA vez.
        // Evita que Vite descubra deps on-demand durante la carga → pantalla en blanco.
        include: [
            // React core — siempre necesario
            'react',
            'react-dom',
            'react-dom/client',
            // Inertia
            '@inertiajs/react',
            // HTTP + estado
            'axios',
            'zustand',
            '@tanstack/react-query',
            // UI crítica
            'framer-motion',
            'lucide-react',
            'clsx',
            'tailwind-merge',
            'react-hot-toast',
            // Formularios
            'react-hook-form',
            '@hookform/resolvers/zod',
            'zod',
            // Fechas
            'date-fns',
            // i18n — pesado pero necesario
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            // Routing
            'ziggy-js',
            // WebSockets — se inicializan en bootstrap
            'laravel-echo',
            'pusher-js',
        ],
        // Excluir paquetes muy pesados que se cargan lazy o no se usan en runtime
        exclude: [
            '@ffmpeg/ffmpeg',
            '@ffmpeg/util',
            '@ffmpeg/core',
            // AWS SDK es enorme — solo se usa en uploads, se carga lazy
            '@aws-sdk/client-s3',
        ],
        // Forzar re-bundle si cambian las deps (útil tras npm install)
        force: false,
    },
    build: {
        // Code splitting configuration
        rollupOptions: {
            output: {
                // Manual chunk splitting for better caching
                manualChunks: (id) => {
                    // Vendor chunks
                    if (id.includes('node_modules')) {
                        // React ecosystem
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor-react';
                        }
                        // Inertia
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia';
                        }
                        // Charts and visualization
                        if (id.includes('recharts') || id.includes('@ant-design/plots')) {
                            return 'vendor-charts';
                        }
                        // Form libraries
                        if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
                            return 'vendor-forms';
                        }
                        // Date libraries
                        if (id.includes('date-fns') || id.includes('react-datepicker') || id.includes('react-aria') || id.includes('@internationalized') || id.includes('@react-aria') || id.includes('@react-stately')) {
                            return 'vendor-dates';
                        }
                        // i18n
                        if (id.includes('i18next') || id.includes('react-i18next')) {
                            return 'vendor-i18n';
                        }
                        // Icons
                        if (id.includes('lucide-react') || id.includes('react-icons')) {
                            return 'vendor-icons';
                        }
                        // Heavy libraries
                        if (id.includes('@ffmpeg')) {
                            return 'vendor-ffmpeg';
                        }
                        if (id.includes('aws-sdk')) {
                            return 'vendor-aws';
                        }
                        // Other vendors
                        return 'vendor-other';
                    }

                    // Service Worker code in separate chunk
                    if (id.includes('/sw/') || id.includes('workbox')) {
                        return 'service-worker';
                    }

                    // Merge stores + utils into a single chunk to avoid circular
                    // dependencies (stores import utils and vice-versa).
                    // Stores that are both statically and dynamically imported
                    // (publicationStore, manageContentUIStore) must also live here
                    // so Vite doesn't try to move them into a dynamic chunk.
                    if (id.includes('/stores/') || id.includes('/Utils/')) {
                        return 'app-core';
                    }

                    // Let Rollup handle page-level splitting automatically.
                    // Assigning pages to named chunks caused cycles because pages
                    // import from app-core (formerly utils) which would then
                    // re-enter the page chunk.
                },
                // Optimize chunk file names
                chunkFileNames: (chunkInfo) => {
                    const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').slice(-1)[0] : 'chunk';
                    return `assets/js/[name]-[hash].js`;
                },
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            },
        },
        // Increase chunk size warning limit for better splitting
        chunkSizeWarningLimit: 1000,
        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: isProduction, // Remove console.log in production
                drop_debugger: isProduction,
                pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
            },
            format: {
                comments: false, // Remove comments
            },
        },
        // Source maps only in development
        sourcemap: !isProduction,
        // CSS code splitting
        cssCodeSplit: true,
        // Ensure manifest is generated properly
        manifest: true,
        // Output directory
        outDir: 'public/build',
        // Empty output directory before build
        emptyOutDir: true,
    },
    server: isProduction ? {} : {
        host: '0.0.0.0',
        port: 5173,

        // Pre-transformar el critical path al arrancar el servidor, en vez de
        // esperar al primer request del navegador. Sin esto, la primera carga
        // dispara cientos de transforms on-demand sobre el bind mount de Docker
        // (lento en Windows) → minutos de pantalla en blanco.
        warmup: {
            clientFiles: [
                './resources/js/app.tsx',
                './resources/js/i18n.ts',
                './resources/js/Layouts/AuthenticatedLayout.tsx',
                './resources/js/Layouts/GuestLayout.tsx',
                './resources/js/Pages/Auth/Login.tsx',
                './resources/js/Pages/Dashboard.tsx',
                './resources/js/Pages/Welcome.tsx',
            ],
        },
        // origin fija el URL que laravel-vite-plugin escribe en public/hot.
        // Sin esto, hmr.clientPort contamina el hot file y rompe los asset URLs.
        origin: `http://${host}:5173`,
        // strictPort: true causaba crash silencioso cuando el puerto quedaba ocupado
        // por un proceso zombie tras un reinicio del contenedor
        strictPort: false,

        hmr: {
            host: host,
            clientPort: 5173,
            protocol: 'ws',
            timeout: 60000,
        },

        watch: {
            // En Docker con bind mount de Windows, el polling bloquea el event loop.
            // Usamos polling solo con interval alto para no saturar el sistema.
            // Los archivos críticos (vendor, node_modules, etc.) están excluidos.
            usePolling: true,
            interval: 2000,
            binaryInterval: 4000,
            ignored: [
                '**/vendor/**',
                '**/storage/**',
                '**/docker/**',
                '**/node_modules/**',
                '**/.env*',
                '**/public/build/**',
                '**/public/hot',
                '**/bootstrap/cache/**',
                '**/.git/**',
            ],
        },

        cors: true,

        allowedHosts: [
            'localhost',
            'leviathan-port.tail4af8a1.ts.net',
            '100.125.246.50',
            '127.0.0.1',
            '.ngrok-free.app',
            '.trycloudflare.com',
        ],
    },
});
