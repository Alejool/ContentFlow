/**
 * roleHelpers.tsx
 *
 * Centralized role configuration helper.
 * Maps each role slug to its display name, lucide-react icon, and color palette.
 *
 * Key exports for consumers:
 *  - `getRoleConfig(slug)`          → full config for a slug
 *  - `getRoleLabel(slug, t)`        → translated label for a slug (single source of truth)
 *  - `buildRoleSelectOptions(roles, t, opts)` → ready-to-use Select option list with icon + translated label
 *
 * Used by: InviteMemberModal, MemberRow, RolesManagementTab, RoleBadge, etc.
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Crown, Eye, PencilLine, Shield, ShieldCheck, User, UserCog } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoleConfig {
  /** Role slug (e.g. 'owner', 'admin', 'editor') */
  slug: string;
  /** Human-readable default label (fallback when no translation) */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind gradient classes for the icon container (from-X to-Y) */
  gradient: string;
  /** Flat icon bg for flat-style icon containers */
  iconBg: string;
  /** Flat icon colour for flat-style icon containers */
  iconColor: string;
  /** Tailwind text color classes used in badges / labels */
  textColor: string;
  /** Tailwind classes used in pill badges */
  badgeClass: string;
  /**
   * i18n key inside the "workspace" namespace for this role's translated label.
   * e.g. 'workspace.owners' → resolved via t('workspace.owners')
   */
  i18nKey: string;
}

/** Option shape consumed by the system <Select /> component */
export interface RoleSelectOption {
  value: number;
  label: string;
  /** Rendered icon node — already styled */
  icon: ReactNode;
}

// ─── Role configurations ──────────────────────────────────────────────────────

/**
 * Role configuration list ordered by privilege level (highest first).
 * Add or modify entries here to extend role support project-wide.
 */
export const ROLE_CONFIGS: RoleConfig[] = [
  {
    // ── Owner — amber/gold: highest privilege, stands out immediately
    slug: 'owner',
    label: 'Owner',
    i18nKey: 'workspace.owners',
    icon: Crown,
    gradient: 'from-amber-400 to-yellow-500',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-700 dark:text-amber-400',
    badgeClass:
      'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  },
  {
    // ── Admin — sky blue: trusted, elevated but not owner
    slug: 'admin',
    label: 'Admin',
    i18nKey: 'workspace.admins',
    icon: ShieldCheck,
    gradient: 'from-sky-500 to-blue-600',
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
    textColor: 'text-sky-700 dark:text-sky-400',
    badgeClass:
      'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30',
  },
  {
    // ── Editor — violet/indigo: creative, content-focused
    slug: 'editor',
    label: 'Editor',
    i18nKey: 'workspace.editors',
    icon: PencilLine,
    gradient: 'from-violet-500 to-indigo-600',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconColor: 'text-violet-600 dark:text-violet-400',
    textColor: 'text-violet-700 dark:text-violet-400',
    badgeClass:
      'bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30',
  },
  {
    // ── Member — emerald: standard collaborator
    slug: 'member',
    label: 'Member',
    i18nKey: 'workspace.member',
    icon: User,
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  },
  {
    // ── Viewer — neutral slate: read-only, minimal prominence
    slug: 'viewer',
    label: 'Viewer',
    i18nKey: 'workspace.viewers',
    icon: Eye,
    gradient: 'from-slate-400 to-gray-500',
    iconBg: 'bg-slate-50 dark:bg-slate-500/10',
    iconColor: 'text-slate-500 dark:text-slate-400',
    textColor: 'text-slate-600 dark:text-slate-400',
    badgeClass:
      'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30',
  },
];

/** Fallback config for unknown / custom roles */
const FALLBACK_CONFIG: RoleConfig = {
  slug: 'unknown',
  label: 'Member',
  i18nKey: 'workspace.member',
  icon: UserCog,
  gradient: 'from-gray-400 to-slate-400',
  iconBg: 'bg-gray-50 dark:bg-gray-500/10',
  iconColor: 'text-gray-500 dark:text-gray-400',
  textColor: 'text-gray-600 dark:text-gray-400',
  badgeClass:
    'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30',
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the full RoleConfig for a given role slug.
 * Falls back to FALLBACK_CONFIG if the slug is not found.
 */
export function getRoleConfig(slug: string): RoleConfig {
  return ROLE_CONFIGS.find((r) => r.slug === slug) ?? FALLBACK_CONFIG;
}

/**
 * Returns the translated label for a role slug.
 *
 * This is the **single source of truth** for role display names across the app.
 * Pass the `t` function from `useTranslation()` and it will resolve the correct
 * translation for the active locale automatically.
 *
 * @example
 *   const { t } = useTranslation();
 *   getRoleLabel('admin', t)  // → 'Administrador' (ES) | 'Admin' (EN)
 *   getRoleLabel('owner', t)  // → 'Propietario' (ES) | 'Owner' (EN)
 */
export function getRoleLabel(slug: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const config = getRoleConfig(slug);
  return t(config.i18nKey, { defaultValue: config.label });
}

/**
 * Builds a ready-to-render option list for the system `<Select />` component.
 *
 * Each option includes:
 *  - `value`  → role.id (number)
 *  - `label`  → translated role name via `getRoleLabel`
 *  - `icon`   → rendered icon node styled with the role's color
 *
 * @param roles      Raw role list from the backend (must have id, slug, name)
 * @param t          `t` function from `useTranslation()`
 * @param opts.excludeSlugs  Slugs to omit from the list (default: ['owner'])
 * @param opts.iconSize      Tailwind size classes for the icon (default: 'h-3.5 w-3.5')
 *
 * @example
 *   const { t } = useTranslation();
 *   const options = buildRoleSelectOptions(roles, t);
 *   // → [{ value: 2, label: 'Administrador', icon: <ShieldCheck .../> }, ...]
 */
export function buildRoleSelectOptions(
  roles: Array<{ id: number; slug: string; name: string }>,
  t: (key: string, opts?: Record<string, unknown>) => string,
  opts: { excludeSlugs?: string[]; iconSize?: string } = {},
): RoleSelectOption[] {
  const { excludeSlugs = ['owner'], iconSize = 'h-3.5 w-3.5' } = opts;

  return roles
    .filter((role) => !excludeSlugs.includes(role.slug))
    .map((role) => {
      const config = getRoleConfig(role.slug);
      const Icon = config.icon;
      return {
        value: role.id,
        label: getRoleLabel(role.slug, t),
        icon: <Icon className={`${iconSize} ${config.iconColor}`} />,
      };
    });
}

// ─── Convenience helpers (unchanged) ─────────────────────────────────────────

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
