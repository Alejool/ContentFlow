/**
 * planMeta.ts — single source of truth for subscription plans + billing status.
 *
 * Plan tiers (free / demo / starter / professional / enterprise) → badge color,
 * icon and label; subscription statuses (active / trialing / past_due /
 * canceled) → badge color. All colors reference `@theme` tokens so tier
 * identity rebrands with the rest of the system.
 */
import { Crown, TrendingUp, Zap, type LucideIcon } from 'lucide-react';

export type PlanTier = 'free' | 'demo' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'cancelled';

export interface PlanMeta {
  tier: PlanTier;
  badge: string;
  Icon: LucideIcon;
  labelKey: string;
}

const PLAN_META: Record<PlanTier, Omit<PlanMeta, 'tier'>> = {
  free: {
    badge: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    Icon: Zap, labelKey: 'plans.free',
  },
  demo: {
    badge: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-200',
    Icon: Zap, labelKey: 'plans.demo',
  },
  starter: {
    badge: 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300',
    Icon: TrendingUp, labelKey: 'plans.starter',
  },
  professional: {
    badge: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
    Icon: Crown, labelKey: 'plans.professional',
  },
  enterprise: {
    badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    Icon: Crown, labelKey: 'plans.enterprise',
  },
};

const SUBSCRIPTION_BADGE: Record<SubscriptionStatus, string> = {
  active: 'bg-success-500 text-white',
  trialing: 'bg-info-500 text-white',
  past_due: 'bg-error-500 text-white',
  canceled: 'bg-neutral-400 text-white',
  cancelled: 'bg-neutral-400 text-white',
};

function normalizeTier(planId?: string): PlanTier {
  const key = (planId ?? '').toLowerCase() as PlanTier;
  return key in PLAN_META ? key : 'free';
}

/** Full metadata for a plan tier (badge + icon + label). */
export function getPlanMeta(planId?: string): PlanMeta {
  const key = normalizeTier(planId);
  return { tier: key, ...PLAN_META[key] };
}

export function getPlanBadgeClass(planId?: string): string {
  return PLAN_META[normalizeTier(planId)].badge;
}

/** Badge className for a subscription/billing status. */
export function getSubscriptionBadgeClass(status?: string): string {
  const key = (status ?? '').toLowerCase() as SubscriptionStatus;
  return SUBSCRIPTION_BADGE[key] ?? SUBSCRIPTION_BADGE.canceled;
}
