/**
 * Onboarding Helpers
 *
 * Pure functions that encapsulate the business rules for deciding
 * whether the onboarding flow should be presented to a given user.
 */

import type { User } from '@/types';
import type { OnboardingState } from '@/types/onboarding';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Users created within this window (in days) are considered "recent". */
const RECENT_USER_THRESHOLD_DAYS = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the user was created within the last
 * `RECENT_USER_THRESHOLD_DAYS` days.
 *
 * @param createdAt - ISO-8601 date string from the `User` record, or `undefined`.
 */
export function isUserRecent(createdAt: string | undefined): boolean {
  if (!createdAt) return false;

  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const elapsedDays = elapsedMs / (1_000 * 60 * 60 * 24);

  return elapsedDays <= RECENT_USER_THRESHOLD_DAYS;
}

/**
 * Determines whether the onboarding flow should be rendered.
 *
 * Conditions (all must be true):
 *  - A valid `user` object exists.
 *  - `onboardingState` has been shared by the back-end.
 *  - The onboarding has not been completed (`completedAt` is `null`).
 *  - The user was created recently (within `RECENT_USER_THRESHOLD_DAYS`).
 */
export function shouldDisplayOnboarding(
  user: User | null | undefined,
  onboardingState: OnboardingState | undefined,
): boolean {
  if (!user || !onboardingState) return false;
  if (onboardingState.completedAt !== null) return false;

  return isUserRecent(user.created_at);
}
