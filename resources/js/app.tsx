import { ErrorBoundary } from "@/Components/common/ui/ErrorBoundary";
import ThemedToaster from "@/Components/common/ui/ThemedToaster";
import { ThemeProvider } from "@/Contexts/ThemeContext";
import { ErrorInterceptor } from "@/Services/ErrorInterceptor";
import { PageProps } from "@/types";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import "../css/app.css";
import "./bootstrap";
import "./i18n";

ErrorInterceptor.initialize();

const appName = import.meta.env.VITE_APP_NAME || "contentFlow";

// Lazy load i18n
const loadI18n = () => import("./i18n");

createInertiaApp<PageProps>({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    const cleanName = name.startsWith("/") ? name.slice(1) : name;
    // Lazy loading agresivo por rutas
    return resolvePageComponent(
      `./Pages/${cleanName}.tsx`,
      import.meta.glob("./Pages/**/*.tsx")
    );
  },

  setup({ el, App, props }) {
    const root = createRoot(el);

    const user = props.initialPage.props.auth?.user;
    const userLocale = user?.locale;
    
    if (userLocale) {
      loadI18n().then(({ default: i18n }) => {
        i18n.changeLanguage(userLocale);
      });
    }

    root.render(
      <ErrorBoundary>
        <ThemeProvider
          isAuthenticated={!!user}
          initialTheme={user?.theme as "light" | "dark" | undefined}
        >
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>}>
            <App {...props} />
          </Suspense>
          <ThemedToaster />
        </ThemeProvider>
      </ErrorBoundary>
    );
  },
  progress: {
    color: "#ad421e",
  },
});
