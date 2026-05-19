import type { NavRoute, NavSection } from '@/types/navigation';
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Film,
  Home,
  Layers,
  LayoutDashboard,
  Plus,
  Shield,
  User,
} from 'lucide-react';

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.section.dashboard',
    routes: [
      {
        nameKey: 'nav.dashboard',
        routeName: 'dashboard',
        icon: Home,
      },
    ],
  },
  {
    id: 'content',
    labelKey: 'nav.section.content',
    routes: [
      {
        nameKey: 'nav.manageContent',
        routeName: 'content.index',
        icon: FileText,
      },
      {
        nameKey: 'nav.calendar',
        routeName: 'content.index',
        url: '/content?tab=calendar',
        icon: Film,
      },
      {
        nameKey: 'nav.socialNetworks',
        routeName: 'content.index',
        url: '/content',
        icon: Building2,
      },
    ],
  },
  {
    id: 'analytics',
    labelKey: 'nav.section.analytics',
    routes: [
      {
        nameKey: 'nav.analytics',
        routeName: 'analytics.index',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'workspaces',
    labelKey: 'nav.section.workspaces',
    routes: [
      {
        nameKey: 'nav.workspaces',
        routeName: 'workspaces.index',
        icon: Layers,
      },
    ],
  },
  {
    id: 'subscription',
    labelKey: 'nav.section.subscription',
    routes: [
      {
        nameKey: 'nav.billing',
        routeName: 'subscription.billing',
        icon: CreditCard,
      },
      {
        nameKey: 'nav.addons',
        routeName: 'subscription.addons',
        icon: Plus,
      },
    ],
  },
  {
    id: 'settings',
    labelKey: 'nav.section.settings',
    routes: [
      {
        nameKey: 'nav.profile',
        routeName: 'profile.edit',
        icon: User,
      },
    ],
  },
  {
    id: 'admin',
    labelKey: 'nav.section.admin',
    routes: [
      {
        nameKey: 'nav.adminDashboard',
        routeName: 'admin.dashboard',
        icon: LayoutDashboard,
      },
      {
        nameKey: 'nav.adminSettings',
        routeName: 'admin.system-settings',
        icon: Shield,
      },
    ],
  },
];

export function getRouteUrl(route: NavRoute): string {
  if (route.url) return route.url;

  const routeUrls: Record<string, string> = {
    dashboard: '/dashboard',
    'content.index': '/content',
    'analytics.index': '/analytics',
    'workspaces.index': '/workspaces',
    'profile.edit': '/profile',
    'subscription.billing': '/subscription/billing',
    'subscription.addons': '/subscription/addons',
    'admin.dashboard': '/admin/dashboard',
    'admin.system-settings': '/admin/system-settings',
  };

  return routeUrls[route.routeName] || `/${route.routeName.replace('.', '/')}`;
}

export function isRouteActive(route: NavRoute): boolean {
  if (typeof window === 'undefined') return false;

  const currentPath = window.location.pathname;

  if (route.url) {
    const [urlPath, queryString] = route.url.split('?');
    const matchesPath = currentPath === urlPath || currentPath.startsWith(urlPath + '/');
    if (!matchesPath) return false;

    if (queryString) {
      const requiredParams = new URLSearchParams(queryString);
      const currentParams = new URLSearchParams(window.location.search);
      for (const [key, value] of requiredParams) {
        if (currentParams.get(key) !== value) return false;
      }
    }

    return true;
  }

  const routePatterns: Record<string, string[]> = {
    dashboard: ['/dashboard'],
    'content.index': ['/content'],
    'analytics.index': ['/analytics'],
    'workspaces.index': ['/workspaces'],
    'profile.edit': ['/profile'],
    'subscription.billing': ['/subscription/billing'],
    'subscription.addons': ['/subscription/addons'],
    'admin.dashboard': ['/admin/dashboard'],
    'admin.system-settings': ['/admin/system-settings'],
  };

  const patterns = routePatterns[route.routeName] || [`/${route.routeName.replace('.', '/')}`];

  return patterns.some(
    (pattern) => currentPath === pattern || currentPath.startsWith(pattern + '/'),
  );
}

export function isSectionActive(section: NavSection): boolean {
  return section.routes.some((route) => isRouteActive(route));
}