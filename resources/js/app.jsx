import '../css/app.css';
import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify'; // Importa ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Importa los estilos de Toastify

const appName = import.meta.env.VITE_APP_NAME || 'life-image';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <ToastContainer /> {/* Agrega el ToastContainer aquí */}
            </>,
        );
    },
    progress: {
        color: '#ad421e',
    },
});