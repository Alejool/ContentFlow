/**
 * uploadMeta.ts — single source of truth for upload / processing lifecycle.
 *
 * Upload statuses (uploading / processing / pending / queued / completed /
 * error / failed / cancelled / paused) → badge color, icon (component + color),
 * progress-bar color and translated label. Uses `@theme` semantic tokens so a
 * rebrand recolors uploads too.
 */
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  PauseCircle,
  Upload,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export type UploadStatus =
  | 'uploading'
  | 'processing'
  | 'pending'
  | 'queued'
  | 'completed'
  | 'error'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface UploadMeta {
  status: UploadStatus;
  badge: string;
  iconColor: string;
  /** Progress-bar fill color. */
  progress: string;
  Icon: LucideIcon;
  /** Whether the icon should spin (in-flight states). */
  spin: boolean;
  labelKey: string;
}

const UPLOAD_META: Record<UploadStatus, Omit<UploadMeta, 'status'>> = {
  uploading: {
    badge: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
    iconColor: 'text-info-500', progress: 'bg-info-500', Icon: Upload, spin: true,
    labelKey: 'upload.status.uploading',
  },
  processing: {
    badge: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
    iconColor: 'text-info-500', progress: 'bg-info-500', Icon: Loader2, spin: true,
    labelKey: 'upload.status.processing',
  },
  pending: {
    badge: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    iconColor: 'text-warning-500', progress: 'bg-warning-500', Icon: Clock, spin: false,
    labelKey: 'upload.status.pending',
  },
  queued: {
    badge: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    iconColor: 'text-warning-500', progress: 'bg-warning-500', Icon: Clock, spin: false,
    labelKey: 'upload.status.queued',
  },
  completed: {
    badge: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    iconColor: 'text-success-500', progress: 'bg-success-500', Icon: CheckCircle2, spin: false,
    labelKey: 'upload.status.completed',
  },
  error: {
    badge: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
    iconColor: 'text-error-500', progress: 'bg-error-500', Icon: AlertCircle, spin: false,
    labelKey: 'upload.status.error',
  },
  failed: {
    badge: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
    iconColor: 'text-error-500', progress: 'bg-error-500', Icon: AlertCircle, spin: false,
    labelKey: 'upload.status.failed',
  },
  cancelled: {
    badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-400',
    iconColor: 'text-neutral-400', progress: 'bg-neutral-400', Icon: XCircle, spin: false,
    labelKey: 'upload.status.cancelled',
  },
  paused: {
    badge: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    iconColor: 'text-warning-500', progress: 'bg-warning-400', Icon: PauseCircle, spin: false,
    labelKey: 'upload.status.paused',
  },
};

function normalize(status?: string): UploadStatus {
  const key = (status ?? '') as UploadStatus;
  return key in UPLOAD_META ? key : 'pending';
}

/** Full metadata for an upload status. */
export function getUploadMeta(status?: string): UploadMeta {
  const key = normalize(status);
  return { status: key, ...UPLOAD_META[key] };
}

export function getUploadBadgeClass(status?: string): string {
  return UPLOAD_META[normalize(status)].badge;
}

export function getUploadProgressColor(status?: string): string {
  return UPLOAD_META[normalize(status)].progress;
}
