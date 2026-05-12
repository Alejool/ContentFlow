import { AnimatedPage } from '@/Components/common/motion/AnimatedPage';
import { InertiaProgressIndicator } from '@/Components/common/motion/InertiaProgressIndicator';
import { ErrorBoundary } from '@/Components/common/ui/ErrorBoundary';
import ThemedToaster from '@/Components/common/ui/ThemedToaster';
import { ThemeProvider } from '@/Contexts/ThemeContext';
import { QueryProvider } from '@/providers/QueryProvider';
import type { PageProps } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

// ─── Importación síncrona de i18n ─────────────────────────────────────────────
// i18n debe cargarse ANTES del render para que las traducciones estén disponibles
import i18n from './i18n';

// ─── Carga diferida de módulos pesados ────────────────────────────────────────
// bootstrap (Echo + Pusher) se carga después del primer render,
// no bloquea la carga inicial de la UI.
const initBootstrap = () => import('./bootstrap');

// ServiceWorkerUpdate no es crítico para el render inicial
const ServiceWorkerUpdate = React.lazy(() =>
  import('./Components/ServiceWorkerUpdate').then((m) => ({ default: m.ServiceWorkerUpdate })),
);

// Utilidades de accesibilidad — se inicializan después del primer render
const initAccessibility = async () => {
  const [{ ariaAnnouncer }, { FocusManager }, { FocusVisibleManager }, { ErrorInterceptor }] =
    await Promise.all([
      import('@/Utils/ARIAAnnouncer'),
      import('@/Utils/FocusManager'),
      import('@/Utils/FocusVisibleManager'),
      import('@/Services/ErrorInterceptor'),
    ]);
  ErrorInterceptor.initialize();
  FocusVisibleManager.initialize();
  FocusManager.initialize();
  ariaAnnouncer.initialize();
};

// ─── Global error handler for navigation errors ────────────────────────────────
// Suppress "AbortError: Transition was skipped" warnings in production
// These are expected when navigations are cancelled (e.g., rapid clicks)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Check if it's an AbortError from Inertia navigation
    if (
      event.reason?.name === 'AbortError' &&
      event.reason?.message?.includes('Transition was skipped')
    ) {
      // Prevent the error from appearing in console
      event.preventDefault();
      
      // Log in development for debugging
      if (import.meta.env.DEV) {
        console.debug('[Inertia] Navigation cancelled (expected behavior):', event.reason.message);
      }
    }
  });

  // Also handle Inertia's cancelled event
  router.on('cancel', () => {
    if (import.meta.env.DEV) {
      console.debug('[Inertia] Navigation cancelled');
    }
  });
}

const appName = import.meta.env['VITE_APP_NAME'] || 'Intellipost';

createInertiaApp<PageProps>({
  title: (title: any) => `${title} - ${appName}`,
  resolve: (name: string) => {
    const cleanName = name.startsWith('/') ? name.slice(1) : name;
    return resolvePageComponent(`./Pages/${cleanName}.tsx`, import.meta.glob('./Pages/**/*.tsx'));
  },

  setup({ el, App, props }: { el: HTMLElement; App: React.ComponentType<any>; props: any }) {
    const root = createRoot(el);

    const user = props.initialPage.props.auth?.user;

    // Configurar idioma del usuario si está disponible
    const userLocale = user?.locale;
    if (userLocale && i18n.language !== userLocale) {
      i18n.changeLanguage(userLocale);
    }

    // Inicializar bootstrap y accesibilidad en paralelo, sin bloquear el render
    Promise.all([initBootstrap(), initAccessibility()]);

    root.render(
      <ErrorBoundary>
        <QueryProvider>
          <ThemeProvider
            isAuthenticated={!!user}
            initialTheme={
              user?.theme === 'light' || user?.theme === 'dark' ? user.theme : undefined
            }
            workspaceId={user?.current_workspace_id}
          >
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <AnimatedPage variant="fade" pageKey={props.initialPage.url}>
                <App {...props} />
              </AnimatedPage>
            </Suspense>
            <ThemedToaster />
            <Suspense fallback={null}>
              <ServiceWorkerUpdate />
            </Suspense>
            <InertiaProgressIndicator color="#ad421e" />
          </ThemeProvider>
        </QueryProvider>
      </ErrorBoundary>,
    );
  },
});
