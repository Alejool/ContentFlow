import '../css/app.css';
import './bootstrap';
import './i18n'; // Initialize i18n
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"

const appName = import.meta.env.VITE_APP_NAME || 'life-image';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.tsx');
        const pagesJsx = import.meta.glob('./Pages/**/*.jsx');
        
        if (pages[`./Pages/${name}.tsx`]) {
             return resolvePageComponent(`./Pages/${name}.tsx`, pages);
        }
        return resolvePageComponent(`./Pages/${name}.jsx`, pagesJsx);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <ChakraProvider value={defaultSystem}>
                    <App {...props} />
                </ChakraProvider >
                <ToastContainer />
            </>,
        );
    },
    progress: {
        color: '#ad421e',
    },
});