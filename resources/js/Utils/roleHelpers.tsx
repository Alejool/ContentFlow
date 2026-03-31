/**
 * roleHelpers.tsx
 *
 * Centralized role configuration helper.
 * Maps each role slug to its display name, lucide-react icon, and color palette.
 * Used by InviteMemberModal, RolesManagementTab, RoleBadge, etc.
 */

import { Crown, Eye, PencilLine, Shield, ShieldCheck, User, UserCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface RoleConfig {
  /** Role slug (e.g. 'owner', 'admin', 'editor') */
  slug: string;
  /** Human-readable default label (fallback when no translation) */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /**
   * Tailwind gradient classes for the icon container background.
   * Format: 'from-X-500 to-Y-500'
   */
  gradient: string;
  /**
   * Tailwind text color classes used in badges / labels.
   * Format: 'text-X-700 dark:text-X-400'
   */
  textColor: string;
  /**
   * Tailwind border + bg classes used in badges.
   */
  badgeClass: string;
}

/**
 * Role configuration list ordered by privilege level (highest first).
 * Add or modify entries here to extend role support project-wide.
 */
export const ROLE_CONFIGS: RoleConfig[] = [
  {
    slug: 'owner',
    label: 'Owner',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
    textColor: 'text-amber-700 dark:text-amber-400',
    badgeClass:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
  },
  {
    slug: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    gradient: 'from-primary-500 to-primary-600',
    textColor: 'text-primary-700 dark:text-primary-400',
    badgeClass:
      'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50',
  },
  {
    slug: 'editor',
    label: 'Editor',
    icon: PencilLine,
    gradient: 'from-indigo-500 to-blue-500',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    badgeClass:
      'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50',
  },
  {
    slug: 'member',
    label: 'Member',
    icon: User,
    gradient: 'from-emerald-500 to-green-500',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
  },
  {
    slug: 'viewer',
    label: 'Viewer',
    icon: Eye,
    gradient: 'from-slate-500 to-zinc-500',
    textColor: 'text-slate-700 dark:text-slate-400',
    badgeClass:
      'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/50',
  },
];

/** Fallback config for unknown roles */
const FALLBACK_CONFIG: RoleConfig = {
  slug: 'unknown',
  label: 'Member',
  icon: UserCog,
  gradient: 'from-slate-400 to-gray-400',
  textColor: 'text-gray-700 dark:text-gray-400',
  badgeClass:
    'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50',
};

/**
 * Returns the RoleConfig for a given role slug.
 * Falls back to FALLBACK_CONFIG if the slug is not found.
 */
export function getRoleConfig(slug: string): RoleConfig {
  return ROLE_CONFIGS.find((r) => r.slug === slug) ?? FALLBACK_CONFIG;
}

/**
 * Returns the Lucide icon component for a given role slug.
 */
export function getRoleIcon(slug: string): LucideIcon {
  return getRoleConfig(slug).icon;
}

/**
 * Returns the gradient CSS classes for a given role slug.
 * Useful for icon container backgrounds.
 */
export function getRoleGradient(slug: string): string {
  return getRoleConfig(slug).gradient;
}

/**
 * Returns the badge CSS classes for a given role slug.
 */
export function getRoleBadgeClass(slug: string): string {
  return getRoleConfig(slug).badgeClass;
}

/**
 * Returns the Shield icon from lucide (kept for backward compatibility).
 * @deprecated Use getRoleIcon(slug) instead.
 */
export { Shield as DefaultRoleIcon };
