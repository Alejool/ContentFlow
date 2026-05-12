/**
 * Layout Type Definitions
 *
 * Types specific to AuthenticatedLayout and its Inertia page-props contract.
 * Import `User` and `PageProps` from `@/types` — do NOT redeclare them here.
 */

import type { PageProps } from './PageProps';
import type { User } from './User';
import type { OnboardingState, PublicationTemplate, SocialPlatform, TourStep } from '@/types/Onboarding/onboarding';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

export type AuthenticatedLayoutProps = {
  /** Optional header content rendered inside the sticky top bar. */
  header?: ReactNode;
  /** Page content rendered in the main scrollable area. */
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Inertia shared-data contract for authenticated pages
// ---------------------------------------------------------------------------

/**
 * All properties that the Laravel back-end shares via `Inertia::share()` or
 * passed explicitly on authenticated pages.
 *
 * Extend `PageProps` so the standard `auth` shape is always included.
 */
export type AuthPageProps = PageProps & {
  /** Whether the application is in maintenance mode. */
  maintenanceMode?: boolean;
  /**
   * Optional banner message displayed when `maintenanceMode` is true.
   * Back-end sends this as a string.
   */
  maintenanceBanner?: string;

  // -- Onboarding ----------------------------------------------------------
  onboarding?: OnboardingState;
  tourSteps?: TourStep[];
  availablePlatforms?: SocialPlatform[];
  connectedAccounts?: ConnectedAccount[];
  templates?: PublicationTemplate[];
}

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

export type ConnectedAccount = {
  platform: string;
  account_name: string;
}

/**
 * Resolved auth data extracted from `AuthPageProps['auth']`.
 * Re-exported for convenience so consumers don't need to drill into PageProps.
 */
export type ResolvedAuth = {
  user: User | null;
  current_workspace?: {
    id: number;
    name: string;
    white_label_primary_color?: string;
    white_label_favicon_url?: string;
  } | null;
}
