/**
 * designTokens.ts — Single source of truth for all UI color decisions.
 *
 * RULES (enforced project-wide):
 *
 * 1. SEMANTIC states — always fixed:
 *    success  → green-*
 *    warning  → yellow-* / amber-*
 *    error    → red-*
 *    info     → primary-*    ← NOT blue (blue is not in our palette)
 *
 * 2. UI elements (cards, icons, badges, buttons) → primary-N variants only.
 *    Never blue-N, violet-N, indigo-N, emerald-N, teal-N, orange-N for decorative color.
 *
 * 3. Charts / data-viz with multiple series → exempt (use CHART_PALETTE).
 *
 * 4. Platform brand colors (Facebook, Instagram, etc.) → always use PLATFORM_COLORS.
 *    Platform colors are facts, not decorative choices.
 *
 * 5. Role colors → use ROLE_COLORS (owner=amber, rest=primary variants).
 *
 * 6. Publication / approval status → use STATUS_COLORS (semantic meanings).
 *
 * HOW TO ADD A NEW COLOR USE:
 *  - Ask: is this success/warning/error? → use semantic token.
 *  - Is this a chart series? → use CHART_PALETTE[n].
 *  - Is this a platform? → add to PLATFORM_COLORS.
 *  - Is this a role? → add to ROLE_COLORS.
 *  - Is this a publication/approval status? → add to STATUS_COLORS.
 *  - Otherwise → use primary-* variants.
 */

// ─── Semantic tokens ──────────────────────────────────────────────────────────

export const SEMANTIC = {
  success: {
    bg:     'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon:   'text-green-600 dark:text-green-400',
    text:   'text-green-800 dark:text-green-300',
    title:  'text-green-900 dark:text-green-200',
    badge:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dot:    'bg-green-500',
    iconBg: 'bg-green-100 dark:bg-green-500/20',
  },
  warning: {
    bg:     'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon:   'text-yellow-600 dark:text-yellow-400',
    text:   'text-yellow-800 dark:text-yellow-300',
    title:  'text-yellow-900 dark:text-yellow-200',
    badge:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    dot:    'bg-yellow-500',
    iconBg: 'bg-yellow-100 dark:bg-yellow-500/20',
  },
  error: {
    bg:     'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon:   'text-red-600 dark:text-red-400',
    text:   'text-red-800 dark:text-red-300',
    title:  'text-red-900 dark:text-red-200',
    badge:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    dot:    'bg-red-500',
    iconBg: 'bg-red-100 dark:bg-red-500/20',
  },
  info: {
    // Info uses primary — NOT blue
    bg:     'bg-primary-50 dark:bg-primary-900/20',
    border: 'border-primary-200 dark:border-primary-800',
    icon:   'text-primary-600 dark:text-primary-400',
    text:   'text-primary-800 dark:text-primary-300',
    title:  'text-primary-900 dark:text-primary-200',
    badge:  'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    dot:    'bg-primary-500',
    iconBg: 'bg-primary-100 dark:bg-primary-500/20',
  },
} as const;

// ─── Primary UI variants ──────────────────────────────────────────────────────
// Use these for decorative icons, cards, non-semantic badges.

export const PRIMARY_UI = {
  default: {
    iconBg:    'bg-primary-50 dark:bg-primary-500/10',
    iconColor: 'text-primary-600 dark:text-primary-400',
    badge:     'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    accent:    'text-primary-600 dark:text-primary-400',
  },
  muted: {
    iconBg:    'bg-primary-100 dark:bg-primary-500/15',
    iconColor: 'text-primary-700 dark:text-primary-300',
    badge:     'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
    accent:    'text-primary-700 dark:text-primary-300',
  },
  strong: {
    iconBg:    'bg-primary-200 dark:bg-primary-500/25',
    iconColor: 'text-primary-700 dark:text-primary-300',
    badge:     'bg-primary-200 text-primary-800 dark:bg-primary-800/40 dark:text-primary-200',
    accent:    'text-primary-800 dark:text-primary-200',
  },
} as const;

// ─── Publication status colors ────────────────────────────────────────────────
// Semantic mapping: pending/review → warning, published/approved → success,
// rejected/failed → error, draft/scheduled/processing → primary.

export type PublicationStatus =
  | 'draft' | 'scheduled' | 'publishing' | 'processing'
  | 'pending_review' | 'approved' | 'published'
  | 'rejected' | 'failed' | 'cancelled';

export const STATUS_COLORS: Record<PublicationStatus, {
  badge: string;
  dot: string;
  icon: string;
  bg: string;
}> = {
  draft: {
    badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-400',
    dot:   'bg-neutral-400',
    icon:  'text-neutral-500 dark:text-neutral-400',
    bg:    'bg-neutral-50 dark:bg-neutral-800/50',
  },
  scheduled: {
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    dot:   'bg-primary-500',
    icon:  'text-primary-600 dark:text-primary-400',
    bg:    'bg-primary-50 dark:bg-primary-900/20',
  },
  publishing: {
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    dot:   'bg-primary-500',
    icon:  'text-primary-600 dark:text-primary-400',
    bg:    'bg-primary-50 dark:bg-primary-900/20',
  },
  processing: {
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    dot:   'bg-primary-400',
    icon:  'text-primary-500 dark:text-primary-400',
    bg:    'bg-primary-50 dark:bg-primary-900/20',
  },
  pending_review: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    dot:   'bg-yellow-500',
    icon:  'text-yellow-600 dark:text-yellow-400',
    bg:    'bg-yellow-50 dark:bg-yellow-900/20',
  },
  approved: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dot:   'bg-green-500',
    icon:  'text-green-600 dark:text-green-400',
    bg:    'bg-green-50 dark:bg-green-900/20',
  },
  published: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dot:   'bg-green-500',
    icon:  'text-green-600 dark:text-green-400',
    bg:    'bg-green-50 dark:bg-green-900/20',
  },
  rejected: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    dot:   'bg-red-500',
    icon:  'text-red-600 dark:text-red-400',
    bg:    'bg-red-50 dark:bg-red-900/20',
  },
  failed: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    dot:   'bg-red-500',
    icon:  'text-red-600 dark:text-red-400',
    bg:    'bg-red-50 dark:bg-red-900/20',
  },
  cancelled: {
    badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-400',
    dot:   'bg-neutral-400',
    icon:  'text-neutral-500 dark:text-neutral-400',
    bg:    'bg-neutral-50 dark:bg-neutral-800/50',
  },
};

export function getStatusColors(status: string) {
  return STATUS_COLORS[status as PublicationStatus] ?? STATUS_COLORS.draft;
}

// ─── Approval action colors ───────────────────────────────────────────────────

export type ApprovalAction = 'approved' | 'rejected' | 'submitted' | 'pending'
  | 'cancelled' | 'reassigned' | 'auto_advanced';

export const APPROVAL_COLORS: Record<ApprovalAction, string> = {
  approved:      SEMANTIC.success.badge,
  rejected:      SEMANTIC.error.badge,
  submitted:     SEMANTIC.warning.badge,
  pending:       SEMANTIC.warning.badge,
  cancelled:     'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-400',
  reassigned:    PRIMARY_UI.default.badge,
  auto_advanced: PRIMARY_UI.muted.badge,
};

export function getApprovalColor(action: string): string {
  return APPROVAL_COLORS[action as ApprovalAction] ?? APPROVAL_COLORS.pending;
}

// ─── Campaign status colors ───────────────────────────────────────────────────

export type CampaignStatus = 'active' | 'inactive' | 'completed' | 'paused' | 'deleted';

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  active:    SEMANTIC.success.badge,
  completed: PRIMARY_UI.default.badge,
  paused:    SEMANTIC.warning.badge,
  deleted:   SEMANTIC.error.badge,
  inactive:  'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-400',
};

export function getCampaignStatusColor(status?: string): string {
  return CAMPAIGN_STATUS_COLORS[status as CampaignStatus] ?? CAMPAIGN_STATUS_COLORS.inactive;
}

// ─── Role colors ──────────────────────────────────────────────────────────────
// Owner = amber/warning (highest privilege, must stand out)
// Others = primary variants (normal system colors)

export const ROLE_COLORS: Record<string, {
  iconBg: string;
  iconColor: string;
  badge: string;
  textColor: string;
}> = {
  owner: {
    iconBg:    'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge:     'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    textColor: 'text-amber-700 dark:text-amber-400',
  },
  admin: {
    iconBg:    'bg-primary-100 dark:bg-primary-500/15',
    iconColor: 'text-primary-700 dark:text-primary-300',
    badge:     'bg-primary-100 text-primary-800 border border-primary-200 dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-500/30',
    textColor: 'text-primary-700 dark:text-primary-400',
  },
  manager: {
    iconBg:    'bg-primary-50 dark:bg-primary-500/10',
    iconColor: 'text-primary-600 dark:text-primary-400',
    badge:     'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20',
    textColor: 'text-primary-600 dark:text-primary-400',
  },
  editor: {
    iconBg:    'bg-primary-50 dark:bg-primary-500/10',
    iconColor: 'text-primary-600 dark:text-primary-400',
    badge:     'bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20',
    textColor: 'text-primary-600 dark:text-primary-400',
  },
  viewer: {
    iconBg:    'bg-neutral-100 dark:bg-neutral-700/40',
    iconColor: 'text-neutral-500 dark:text-neutral-400',
    badge:     'bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-700/40 dark:text-neutral-400 dark:border-neutral-600/40',
    textColor: 'text-neutral-600 dark:text-neutral-400',
  },
  default: {
    iconBg:    'bg-neutral-100 dark:bg-neutral-700/40',
    iconColor: 'text-neutral-500 dark:text-neutral-400',
    badge:     'bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-700/40 dark:text-neutral-400',
    textColor: 'text-neutral-600 dark:text-neutral-400',
  },
};

export function getRoleColorToken(slug: string) {
  return ROLE_COLORS[slug] ?? ROLE_COLORS.default;
}

// ─── Platform brand colors ────────────────────────────────────────────────────
// These are FACTS (brand identity), not decorative choices. Exempt from the
// primary-only rule.

export const PLATFORM_COLORS: Record<string, {
  iconBg: string;
  iconColor: string;
  badge: string;
}> = {
  facebook:  { iconBg: 'bg-blue-50 dark:bg-blue-500/10',    iconColor: 'text-blue-600 dark:text-blue-400',    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
  instagram: { iconBg: 'bg-pink-50 dark:bg-pink-500/10',    iconColor: 'text-pink-600 dark:text-pink-400',    badge: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300' },
  twitter:   { iconBg: 'bg-sky-50 dark:bg-sky-500/10',      iconColor: 'text-sky-600 dark:text-sky-400',      badge: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300' },
  linkedin:  { iconBg: 'bg-blue-50 dark:bg-blue-500/10',    iconColor: 'text-blue-700 dark:text-blue-400',    badge: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
  youtube:   { iconBg: 'bg-red-50 dark:bg-red-500/10',      iconColor: 'text-red-600 dark:text-red-400',      badge: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
  tiktok:    { iconBg: 'bg-neutral-100 dark:bg-neutral-700', iconColor: 'text-neutral-800 dark:text-neutral-200', badge: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200' },
  pinterest: { iconBg: 'bg-red-50 dark:bg-red-500/10',      iconColor: 'text-red-600 dark:text-red-400',      badge: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
  google:    { iconBg: 'bg-red-50 dark:bg-red-500/10',      iconColor: 'text-red-500 dark:text-red-400',      badge: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' },
};

export function getPlatformColor(platform: string) {
  const key = platform.toLowerCase();
  return PLATFORM_COLORS[key] ?? PRIMARY_UI.default;
}

// ─── Chart palette ────────────────────────────────────────────────────────────
// ONLY for data-viz with multiple series. Never for UI elements.

export const CHART_PALETTE = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#84cc16', // lime
] as const;

// ─── StatCard color tokens ────────────────────────────────────────────────────
// Replaces the old 8-color system in StatCard.tsx

export type StatCardColor = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export const STAT_CARD_COLORS: Record<StatCardColor, {
  iconBg: string;
  iconColor: string;
  accent: string;
}> = {
  primary: {
    iconBg:    'bg-primary-100 dark:bg-primary-500/20',
    iconColor: 'text-primary-600 dark:text-primary-400',
    accent:    'text-primary-600 dark:text-primary-400',
  },
  success: {
    iconBg:    SEMANTIC.success.iconBg,
    iconColor: SEMANTIC.success.icon,
    accent:    SEMANTIC.success.icon,
  },
  warning: {
    iconBg:    SEMANTIC.warning.iconBg,
    iconColor: SEMANTIC.warning.icon,
    accent:    SEMANTIC.warning.icon,
  },
  error: {
    iconBg:    SEMANTIC.error.iconBg,
    iconColor: SEMANTIC.error.icon,
    accent:    SEMANTIC.error.icon,
  },
  neutral: {
    iconBg:    'bg-neutral-100 dark:bg-neutral-700/40',
    iconColor: 'text-neutral-500 dark:text-neutral-400',
    accent:    'text-neutral-600 dark:text-neutral-400',
  },
};
