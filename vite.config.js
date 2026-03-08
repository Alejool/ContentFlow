import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

const host = process.env.VITE_HMR_HOST || 'localhost';
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
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            manifest: {
                name: 'Social Content Manager',
                short_name: 'ContentMgr',
                description: 'Gestión de publicaciones y contenido social',
                theme_color: '#4F46E5',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait-primary',
                start_url: '/',
                scope: '/',
                categories: ['productivity', 'social'],
                icons: [
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ],
                screenshots: [
                    {
                        src: '/screenshots/desktop.png',
                        sizes: '1280x720',
                        type: 'image/png',
                        form_factor: 'wide'
                    },
                    {
                        src: '/screenshots/mobile.png',
                        sizes: '750x1334',
                        type: 'image/png',
                        form_factor: 'narrow'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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
    optimizeDeps: {
        include: ['@ffmpeg/ffmpeg'],
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
                        if (id.includes('date-fns') || id.includes('react-datepicker')) {
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

                    // Stores in separate chunk
                    if (id.includes('/stores/')) {
                        return 'stores';
                    }

                    // Utils in separate chunk
                    if (id.includes('/Utils/')) {
                        return 'utils';
                    }

                    // Pages - split by route
                    if (id.includes('/Pages/Analytics/')) {
                        return 'page-analytics';
                    }
                    if (id.includes('/Pages/Calendar/')) {
                        return 'page-calendar';
                    }
                    if (id.includes('/Pages/Reels/')) {
                        return 'page-reels';
                    }
                    if (id.includes('/Pages/Workspace/')) {
                        return 'page-workspace';
                    }
                    if (id.includes('/Pages/Profile/')) {
                        return 'page-profile';
                    }
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
            '100.125.246.50',
            '127.0.0.1',
            '.ngrok-free.app',
            '.trycloudflare.com',
        ],
    },
});
