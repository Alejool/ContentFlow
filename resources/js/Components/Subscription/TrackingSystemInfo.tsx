import { ExtensionAddonsInfoBanner } from '@/Components/Subscription/ExtensionAddonsInfoBanner';
import { PlanTrackingInfoBanner } from '@/Components/Subscription/PlanTrackingInfoBanner';

interface TrackingSystemInfoProps {
  startDate?: string;
  showExtensionInfo?: boolean;
  showTrackingInfo?: boolean;
}

/**
 * Component that displays information about the new plan-based tracking system
 * and how extension addons work.
 *
 * @example
 * // Show both banners
 * <TrackingSystemInfo startDate="11 de mayo de 2026 a las 18:03" />
 *
 * @example
 * // Show only tracking info
 * <TrackingSystemInfo showExtensionInfo={false} />
 *
 * @example
 * // Show only extension addons info
 * <TrackingSystemInfo showTrackingInfo={false} />
 */
export function TrackingSystemInfo({
  startDate,
  showExtensionInfo = true,
  showTrackingInfo = true,
}: TrackingSystemInfoProps) {
  return (
    <div className="space-y-6">
      {showTrackingInfo && <PlanTrackingInfoBanner startDate={startDate} />}
      {showExtensionInfo && <ExtensionAddonsInfoBanner />}
    </div>
  );
}
