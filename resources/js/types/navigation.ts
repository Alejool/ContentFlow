import type { LucideIcon } from 'lucide-react';

export type SectionId =
  | 'dashboard'
  | 'content'
  | 'analytics'
  | 'workspaces'
  | 'subscription'
  | 'settings'
  | 'admin';

export interface NavRoute {
  nameKey: string;
  routeName: string;
  icon: LucideIcon;
  url?: string;
  routeParams?: Record<string, any>;
}

export interface NavSection {
  id: SectionId;
  labelKey: string;
  routes: NavRoute[];
}