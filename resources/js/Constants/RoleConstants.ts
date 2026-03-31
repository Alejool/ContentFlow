import { Eye, PencilLine, Shield, User, UserStar } from 'lucide-react';

export type RoleSlug = 'owner' | 'admin' | 'editor' | 'member' | 'viewer';

export const ROLE_STYLES: Record<
  string,
  {
    gradient: string;
    badge: string;
    icon: any;
    color: string;
    dotColor: string; // For simple dots or borders
  }
> = {
  owner: {
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    icon: UserStar,
    color: 'text-amber-600',
    dotColor: 'bg-amber-500',
  },
  admin: {
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600',
    badge:
      'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800',
    icon: Shield,
    color: 'text-primary-600',
    dotColor: 'bg-primary-500',
  },
  editor: {
    gradient: 'bg-gradient-to-br from-indigo-500 to-blue-500',
    badge:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    icon: PencilLine,
    color: 'text-indigo-600',
    dotColor: 'bg-indigo-500',
  },
  member: {
    gradient: 'bg-gradient-to-br from-emerald-500 to-green-500',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    icon: User,
    color: 'text-emerald-600',
    dotColor: 'bg-emerald-500',
  },
  viewer: {
    gradient: 'bg-gradient-to-br from-slate-500 to-zinc-500',
    badge:
      'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800',
    icon: Eye,
    color: 'text-slate-600',
    dotColor: 'bg-slate-500',
  },
  // Fallback
  default: {
    gradient: 'bg-gradient-to-br from-slate-500 to-zinc-500',
    badge:
      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-neutral-700 dark:text-slate-400 dark:border-neutral-600',
    icon: User,
    color: 'text-slate-600',
    dotColor: 'bg-slate-500',
  },
};

export type RoleStyle = {
  gradient: string;
  badge: string;
  icon: any;
  color: string;
  dotColor: string;
};

export const getRoleStyle = (slug: string): RoleStyle => {
  return (ROLE_STYLES[slug] ?? ROLE_STYLES.default) as RoleStyle;
};
