import ThemedToaster from "@/Components/ThemedToaster";
import { ThemeProvider } from "@/Contexts/ThemeContext";
import { PageProps } from "@/types";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import "../css/app.css";
import "./bootstrap";
import "./i18n";

const appName = import.meta.env.VITE_APP_NAME || "contentFlow";

createInertiaApp<PageProps>({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.tsx");
    const pagesJsx = import.meta.glob("./Pages/**/*.tsx");

    if (pages[`./Pages/${name}.tsx`]) {
      return resolvePageComponent(`./Pages/${name}.tsx`, pages);
    }
    return resolvePageComponent(`./Pages/${name}.tsx`, pagesJsx);
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
      <ThemeProvider>
        <App {...props} />
        <ThemedToaster />
      </ThemeProvider>
    );
  },
  progress: {
    color: "#ad421e",
  },
});
