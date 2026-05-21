import type { NavRoute, NavSection } from '@/types/navigation';
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Film,
  Home,
  Layers,
  LayoutDashboard,
  Plus,
  Settings,
  Share2,
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
        nameKey: 'nav.content.records',
        routeName: 'content.index',
        url: '/content?tab=logs',
        icon: FileText,
      },
      {
        nameKey: 'nav.content.publications',
        routeName: 'content.index',
        url: '/content?tab=publications',
        icon: Film,
      },
      {
        nameKey: 'nav.content.campaigns',
        routeName: 'content.index',
        url: '/content?tab=campaigns',
        icon: Building2,
      },
      {
        nameKey: 'nav.socialNetworks',
        routeName: 'content.index',
        url: '/content?section=social',
        icon: Share2,
      },
      {
        nameKey: 'nav.calendar',
        routeName: 'content.index',
        url: '/content?tab=calendar',
        icon: Calendar,
      },
      {
        nameKey: 'nav.content.approvals',
        routeName: 'content.index',
        url: '/content?tab=approvals',
        icon: Shield,
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
        nameKey: 'nav.workspaces.overview',
        routeName: 'workspaces.settings',
        routeParams: { tab: 'overview' },
        icon: Layers,
      },
      {
        nameKey: 'nav.workspaces.usage',
        routeName: 'workspaces.settings',
        routeParams: { tab: 'usage' },
        icon: CreditCard,
      },
      {
        nameKey: 'nav.workspaces.general',
        routeName: 'workspaces.settings',
        routeParams: { tab: 'general' },
        icon: Settings,
      },
      {
        nameKey: 'nav.workspaces.members',
        routeName: 'workspaces.settings',
        routeParams: { tab: 'members' },
        icon: User,
      },
      {
        nameKey: 'nav.workspaces.integrations',
        routeName: 'workspaces.settings',
        routeParams: { tab: 'integrations' },
        icon: Building2,
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

export function getRouteUrl(route: NavRoute, context?: { currentWorkspaceId?: number }): string {
  if (route.url) return route.url;

  if (route.routeParams) {
    if (route.routeName === 'workspaces.settings') {
      const workspaceId = context?.currentWorkspaceId;
      if (!workspaceId) return '/workspaces';
      const params = new URLSearchParams(route.routeParams).toString();
      return `/workspaces/${workspaceId}/settings${params ? `?${params}` : ''}`;
    }
  }

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
  const currentParams = new URLSearchParams(window.location.search);

  if (route.url) {
    const [urlPath, queryString] = route.url.split('?');
    const matchesPath = currentPath === urlPath || currentPath.startsWith(urlPath + '/');
    if (!matchesPath) return false;

    if (queryString) {
      const requiredParams = new URLSearchParams(queryString);

      if (urlPath === '/content') {
        const hasSection = currentParams.has('section');
        const expectsSection = requiredParams.has('section');
        if (hasSection !== expectsSection) return false;
      }

      for (const [key, value] of requiredParams) {
        let currentValue = currentParams.get(key);
        // Default to 'publications' if tab param is missing on /content route
        if (currentValue === null && urlPath === '/content' && key === 'tab') {
          currentValue = 'publications';
        }
        if (currentValue !== value) return false;
      }
      return true;
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
  const matchesPattern = patterns.some(
    (pattern) => currentPath === pattern || currentPath.startsWith(pattern + '/'),
  );

  if (!matchesPattern) {
    if (route.routeName === 'workspaces.settings') {
      const matchesWorkspaceSettings = currentPath.startsWith('/workspaces/') && currentPath.includes('/settings');
      if (!matchesWorkspaceSettings) return false;
    } else {
      return false;
    }
  }

  if (route.routeName === 'content.index') {
    return !currentParams.has('tab') && !currentParams.has('section');
  }

  if (route.routeName === 'workspaces.settings' && route.routeParams) {
    for (const [key, value] of Object.entries(route.routeParams)) {
      let currentValue = currentParams.get(key);
      if (currentValue === null && key === 'tab') {
        currentValue = 'overview';
      }
      if (currentValue !== String(value)) return false;
    }
    return true;
  }

  return true;
}

export function isSectionActive(section: NavSection): boolean {
  return section.routes.some((route) => isRouteActive(route));
}