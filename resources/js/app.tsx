import { ThemeProvider } from "@/Contexts/ThemeContext";
import { PageProps } from "@/types";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "../css/app.css";
import "./bootstrap";
import "./i18n";
const appName = import.meta.env.VITE_APP_NAME || "contentFlow";

createInertiaApp<PageProps>({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.tsx");
    const pagesJsx = import.meta.glob("./Pages/**/*.jsx");

    if (pages[`./Pages/${name}.tsx`]) {
      return resolvePageComponent(`./Pages/${name}.tsx`, pages);
    }
    return resolvePageComponent(`./Pages/${name}.jsx`, pagesJsx);
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
      <>
        <ThemeProvider>
          <ChakraProvider value={defaultSystem}>
            <App {...props} />
          </ChakraProvider>
          <Toaster />
        </ThemeProvider>
      </>
    );
  },
  progress: {
    color: "#ad421e",
  },
});
