import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Platform-specific character limits for the post description/caption field.
 * Source: official platform documentation (2024).
 */
const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  x: 280,
  instagram: 2_200,
  facebook: 63_206,
  linkedin: 3_000,
  tiktok: 2_200,
  youtube: 5_000,
  threads: 500,
  pinterest: 500,
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'Twitter / X',
  x: 'Twitter / X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  threads: 'Threads',
  pinterest: 'Pinterest',
};

interface SocialAccountMin {
  id: number;
  platform: string;
}

interface PlatformCharacterValidatorProps {
  /** The text to validate (description/caption) */
  text: string;
  /** IDs of the currently selected social accounts */
  selectedAccountIds: number[];
  /** All available social accounts (to map id → platform) */
  socialAccounts: SocialAccountMin[];
  /** Whether to show the full per-platform breakdown or just the critical warning */
  compact?: boolean;
  /** Called whenever validity changes */
  onValidChange?: (isValid: boolean) => void;
}

interface PlatformResult {
  platform: string;
  label: string;
  limit: number;
  count: number;
  over: number;
  isOver: boolean;
  pct: number;
}

/**
 * Displays a live character count validation per selected social platform.
 * Returns null when no accounts are selected or text is empty.
 */
export default function PlatformCharacterValidator({
  text,
  selectedAccountIds,
  socialAccounts,
  compact = false,
  onValidChange,
}: PlatformCharacterValidatorProps) {
  const results = useMemo<PlatformResult[]>(() => {
    if (!selectedAccountIds.length) return [];

    const count = text?.length ?? 0;

    // Deduplicate platforms
    const seenPlatforms = new Set<string>();
    const platformResults: PlatformResult[] = [];

    for (const id of selectedAccountIds) {
      const account = socialAccounts.find((a) => a.id === id);
      if (!account) continue;

      const platform = account.platform.toLowerCase();
      if (seenPlatforms.has(platform)) continue;
      seenPlatforms.add(platform);

      const limit = PLATFORM_CHAR_LIMITS[platform];
      if (!limit) continue; // Platform has no text limit

      const over = Math.max(0, count - limit);
      const isOver = count > limit;
      const pct = Math.min(1, count / limit);

      platformResults.push({
        platform,
        label: PLATFORM_LABELS[platform] ?? platform,
        limit,
        count,
        over,
        isOver,
        pct,
      });
    }

    // Sort: most restrictive (smallest limit) first
    return platformResults.sort((a, b) => a.limit - b.limit);
  }, [text, selectedAccountIds, socialAccounts]);

  // Notify parent of validity
  const isValid = results.every((r) => !r.isOver);
  useMemo(() => {
    onValidChange?.(isValid);
  }, [isValid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!results.length) return null;

  const hasErrors = results.some((r) => r.isOver);
  const hasWarnings = !hasErrors && results.some((r) => r.pct >= 0.85);

  if (compact) {
    // Compact single-line mode: show only the most restrictive platform with an issue
    const critical = results.find((r) => r.isOver) ?? results.find((r) => r.pct >= 0.85);
    if (!critical) return null;

    return (
      <div
        className={`flex items-center gap-1.5 text-xs font-medium ${
          critical.isOver ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
        }`}
      >
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          {critical.label}: {critical.count}/{critical.limit}
          {critical.isOver && ` (+${critical.over} sobre el límite)`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        hasErrors
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          : hasWarnings
            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
            : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      }`}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-1.5">
        {hasErrors ? (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
        ) : hasWarnings ? (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-400" />
        ) : (
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
        )}
        <span
          className={`text-xs font-semibold ${
            hasErrors
              ? 'text-red-800 dark:text-red-300'
              : hasWarnings
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-green-800 dark:text-green-300'
          }`}
        >
          {hasErrors
            ? 'El texto supera el límite de algunas plataformas'
            : hasWarnings
              ? 'El texto se acerca al límite'
              : 'Texto dentro del límite en todas las plataformas'}
        </span>
      </div>

      {/* Per-platform rows */}
      <div className="space-y-1.5">
        {results.map((r) => (
          <div key={r.platform}>
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-xs text-gray-700 dark:text-gray-300">{r.label}</span>
              <span
                className={`text-xs font-medium tabular-nums ${
                  r.isOver
                    ? 'text-red-700 dark:text-red-400'
                    : r.pct >= 0.85
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {r.count.toLocaleString()} / {r.limit.toLocaleString()}
                {r.isOver && (
                  <span className="ml-1 text-red-600 dark:text-red-400">
                    (+{r.over} sobre el límite)
                  </span>
                )}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  r.isOver
                    ? 'bg-red-500 dark:bg-red-400'
                    : r.pct >= 0.85
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-green-500 dark:bg-green-400'
                }`}
                style={{ width: `${Math.min(100, r.pct * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Utility: returns true if the given text passes all platform character limits
 * for the selected accounts. Use this to block form submission.
 */
export function isTextValidForPlatforms(
  text: string,
  selectedAccountIds: number[],
  socialAccounts: SocialAccountMin[],
): boolean {
  const count = text?.length ?? 0;
  const seenPlatforms = new Set<string>();

  for (const id of selectedAccountIds) {
    const account = socialAccounts.find((a) => a.id === id);
    if (!account) continue;

    const platform = account.platform.toLowerCase();
    if (seenPlatforms.has(platform)) continue;
    seenPlatforms.add(platform);

    const limit = PLATFORM_CHAR_LIMITS[platform];
    if (limit && count > limit) return false;
  }

  return true;
}
