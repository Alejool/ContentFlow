/**
 * approvalMeta.ts — single source of truth for approval-workflow actions.
 *
 * Approval actions (submitted / approved / rejected / cancelled / reassigned /
 * auto_advanced / pending) → badge color, card surface, icon (component +
 * color) and translated label. Badge colors reuse `designTokens.APPROVAL_COLORS`.
 */
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { APPROVAL_COLORS, getApprovalColor, type ApprovalAction } from './designTokens';

export type { ApprovalAction };

export interface ApprovalMeta {
  action: ApprovalAction;
  /** Badge className (from APPROVAL_COLORS). */
  badge: string;
  /** Card surface + border className. */
  surface: string;
  /** Icon glyph color className. */
  iconColor: string;
  Icon: LucideIcon;
  /** i18n key under `approvals.status.*`. */
  labelKey: string;
  /** i18n key for the "…by" attribution line. */
  byKey: string;
}

const APPROVAL_META: Record<ApprovalAction, Omit<ApprovalMeta, 'action' | 'badge'>> = {
  approved: {
    surface: 'bg-success-50 dark:bg-success-900/10 border-success-100 dark:border-success-900/20',
    iconColor: 'text-success-500',
    Icon: CheckCircle2,
    labelKey: 'approvals.status.approved',
    byKey: 'approvals.approvedBy',
  },
  rejected: {
    surface: 'bg-error-50 dark:bg-error-900/10 border-error-100 dark:border-error-900/20',
    iconColor: 'text-error-500',
    Icon: XCircle,
    labelKey: 'approvals.status.rejected',
    byKey: 'approvals.rejectedBy',
  },
  submitted: {
    surface: 'bg-warning-50 dark:bg-warning-900/10 border-warning-100 dark:border-warning-900/20',
    iconColor: 'text-warning-500',
    Icon: Clock,
    labelKey: 'approvals.status.submitted',
    byKey: 'approvals.submittedBy',
  },
  pending: {
    surface: 'bg-warning-50 dark:bg-warning-900/10 border-warning-100 dark:border-warning-900/20',
    iconColor: 'text-warning-500',
    Icon: Clock,
    labelKey: 'approvals.status.pending',
    byKey: 'approvals.submittedBy',
  },
  cancelled: {
    surface: 'bg-neutral-50 dark:bg-neutral-900/10 border-neutral-200 dark:border-neutral-700/30',
    iconColor: 'text-neutral-400',
    Icon: XCircle,
    labelKey: 'approvals.status.cancelled',
    byKey: 'approvals.cancelledBy',
  },
  reassigned: {
    surface: 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20',
    iconColor: 'text-primary-500',
    Icon: RotateCcw,
    labelKey: 'approvals.status.reassigned',
    byKey: 'approvals.reassignedBy',
  },
  auto_advanced: {
    surface: 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/20',
    iconColor: 'text-primary-500',
    Icon: CheckCircle2,
    labelKey: 'approvals.status.auto_advanced',
    byKey: 'approvals.submittedBy',
  },
};

function normalize(action?: string | null): ApprovalAction {
  const key = (action ?? '') as ApprovalAction;
  return key in APPROVAL_META ? key : 'pending';
}

/** Full metadata for an approval action (badge + surface + icon + labels). */
export function getApprovalMeta(action?: string | null): ApprovalMeta {
  const key = normalize(action);
  return { action: key, badge: APPROVAL_COLORS[key], ...APPROVAL_META[key] };
}

/** Translated label for an approval action. */
export function getApprovalLabel(
  action?: string | null,
  t?: (key: string, fallback?: string) => string,
): string {
  const { labelKey } = getApprovalMeta(action);
  return t ? t(labelKey) : labelKey;
}

export { getApprovalColor };
