import { ErrorBoundary } from "@/Components/common/ui/ErrorBoundary";
import ThemedToaster from "@/Components/common/ui/ThemedToaster";
import { ThemeProvider } from "@/Contexts/ThemeContext";
import { ErrorInterceptor } from "@/Services/ErrorInterceptor";
import { PageProps } from "@/types";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import "../css/app.css";
import "./bootstrap";
import "./i18n";

ErrorInterceptor.initialize();

const appName = import.meta.env.VITE_APP_NAME || "contentFlow";
createInertiaApp<PageProps>({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    const cleanName = name.startsWith("/") ? name.slice(1) : name;
    return resolvePageComponent(
      `./Pages/${cleanName}.tsx`,
      import.meta.glob("./Pages/**/*.tsx")
    );
  },

  setup({ el, App, props }) {
    const root = createRoot(el);

    const userLocale = props.initialPage.props.auth?.user?.locale;
    if (userLocale) {
      import("./i18n").then(({ default: i18n }) => {
        i18n.changeLanguage(userLocale);
      });
    }

    root.render(
      <ErrorBoundary>
        <ThemeProvider>
          <App {...props} />
          <ThemedToaster />
        </ThemeProvider>
      </ErrorBoundary>
    );
  },
  progress: {
    color: "#ad421e",
  },
});
