import { useEffect } from 'react';
import { cssPropertiesManager } from '@/Utils/common/CSSCustomPropertiesManager';
import { User } from '@/types';

interface WorkspaceBranding {
  white_label_primary_color?: string;
  white_label_favicon_url?: string;
}

export function useBranding(user?: User | null, workspace?: WorkspaceBranding | null) {
  useEffect(() => {
    const brandingColor = workspace?.white_label_primary_color;
    // El color de marca es la prioridad salvo que el usuario haya elegido uno manualmente
    // Para simplificar, si hay marca blanca aplicada, usamos ese color por defecto.
    const color = user?.theme_color || brandingColor || 'orange';

    cssPropertiesManager.applyPrimaryColor(color);

    // Dynamically update favicon
    const faviconUrl = workspace?.white_label_favicon_url || '/favicon.ico';

    // Find all icon links (icon, shortcut icon, apple-touch-icon)
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    const timestamp = new Date().getTime();
    const newHref = `${faviconUrl}?v=${timestamp}`;

    if (existingLinks.length > 0) {
      existingLinks.forEach((link) => {
        (link as HTMLLinkElement).href = newHref;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = newHref;
      document.head.appendChild(link);
    }
  }, [
    user?.theme_color,
    workspace?.white_label_primary_color,
    workspace?.white_label_favicon_url,
  ]);
}
