/**
 * statusMeta.ts — the single source of truth for publication/approval status.
 *
 * Everything a component needs about a status — its colors, its translated
 * label and its icon — comes from here. Components must never hand-write a
 * `switch (status)` for colors or labels again; they call these helpers.
 *
 * Color classes are re-used from `designTokens.STATUS_COLORS` (which owns the
 * palette), so this file adds only labels + icons on top and never diverges.
 */
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileEdit,
  Loader2,
  Send,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { STATUS_COLORS, type PublicationStatus } from './designTokens';

export type { PublicationStatus };

export interface StatusColors {
  badge: string;
  dot: string;
  icon: string;
  bg: string;
}

export interface StatusMeta {
  status: PublicationStatus;
  /** i18n key under the `status.*` namespace. */
  labelKey: string;
  /** English fallback used when the i18n key is missing. */
  fallback: string;
  Icon: LucideIcon;
  colors: StatusColors;
}

/** Label + icon per status. Colors come from STATUS_COLORS. */
const STATUS_LABEL_ICON: Record<PublicationStatus, { labelKey: string; fallback: string; Icon: LucideIcon }> = {
  draft: { labelKey: 'status.draft', fallback: 'Draft', Icon: FileEdit },
  scheduled: { labelKey: 'status.scheduled', fallback: 'Scheduled', Icon: CalendarClock },
  publishing: { labelKey: 'status.publishing', fallback: 'Publishing', Icon: Send },
  processing: { labelKey: 'status.processing', fallback: 'Processing', Icon: Loader2 },
  pending_review: { labelKey: 'status.pending_review', fallback: 'Pending review', Icon: Clock },
  approved: { labelKey: 'status.approved', fallback: 'Approved', Icon: CheckCircle2 },
  published: { labelKey: 'status.published', fallback: 'Published', Icon: CheckCircle2 },
  rejected: { labelKey: 'status.rejected', fallback: 'Rejected', Icon: XCircle },
  failed: { labelKey: 'status.failed', fallback: 'Failed', Icon: XCircle },
  cancelled: { labelKey: 'status.cancelled', fallback: 'Cancelled', Icon: Ban },
};

function normalize(status?: string): PublicationStatus {
  const key = (status ?? '').toLowerCase() as PublicationStatus;
  return key in STATUS_LABEL_ICON ? key : 'draft';
}

/** Full metadata bundle for a status (colors + label + icon). */
export function getStatusMeta(status?: string): StatusMeta {
  const key = normalize(status);
  return {
    status: key,
    ...STATUS_LABEL_ICON[key],
    colors: STATUS_COLORS[key],
  };
}

/** Badge color classes — the drop-in replacement for local `getStatusColor`. */
export function getStatusBadgeClass(status?: string): string {
  return STATUS_COLORS[normalize(status)].badge;
}

/** Full color set (badge/dot/icon/bg) for a status. */
export function getStatusColors(status?: string): StatusColors {
  return STATUS_COLORS[normalize(status)];
}

/** Status icon component. */
export function getStatusIcon(status?: string): LucideIcon {
  return STATUS_LABEL_ICON[normalize(status)].Icon;
}

/**
 * Translated status label. Pass the i18next `t` to get the localized string;
 * without it (or when the key is missing) the English fallback is returned.
 */
export function getStatusLabel(
  status?: string,
  t?: (key: string, fallback?: string) => string,
): string {
  const { labelKey, fallback } = getStatusMeta(status);
  return t ? t(labelKey, fallback) : fallback;
}
