import type { LucideIcon } from 'lucide-react';

// ── Usage data from the hook ────────────────────────────────────
export interface AddonInfo {
  total: number;
  remaining: number;
}

export interface UsageCardProps {
  label: string;
  icon: LucideIcon;
  percentage: number;
  used: number | string;
  limit: number | string;
  total_available?: number | string;
  remaining: number | string;
  addon_info?: AddonInfo;
  canBuy: boolean;
  addonType?: string;
  upgradeUrl?: string;
  /** Accent colour key — drives icon, progress bar and badge tinting */
  accent?: 'primary' | 'violet' | 'amber' | 'teal' | 'pink';
}

// ── Page-level props from Inertia ───────────────────────────────
export interface VisibleUsageMetrics {
  publications: boolean;
  social_accounts: boolean;
  storage: boolean;
  ai_requests: boolean;
  team_members: boolean;
}

export interface SystemAddons {
  ai_credits: boolean;
  storage: boolean;
  team_members: boolean;
  publications: boolean;
}
