import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Declare Echo globally
declare global {
  interface Window {
    Echo: any;
  }
}

interface UsageData {
  team_members: any;
  period: {
    year: number;
    month: number;
    start: string;
    end: string;
  };
  plan: string;
  publications: {
    used: number;
    limit: number;
    total_available: number;
    remaining: number;
    percentage: number;
    limit_reached: boolean;
    addon_info?: {
      total: number;
      used: number;
      remaining: number;
    };
  };
  storage: {
    used_bytes: number;
    used_mb: number;
    used_gb: number;
    limit_bytes: number;
    limit_gb: number;
    total_available_bytes: number;
    total_available_gb: number;
    remaining_bytes: number;
    percentage: number;
    limit_reached: boolean;
    addon_info?: {
      total: number;
      used: number;
      remaining: number;
    };
  };
  social_accounts: {
    used: number;
    limit: number;
    total_available: number;
    remaining: number;
    percentage: number;
    limit_reached: boolean;
  };
  limits_reached: boolean;
  limits_reached_at: string | null;
}

interface UseSubscriptionUsageReturn {
  usage: UsageData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSubscriptionUsage(): UseSubscriptionUsageReturn {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { auth } = (usePage().props as any) || {};
  const currentWorkspaceId = auth?.user?.current_workspace_id;

  // Fetch usage data from API
  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/subscription/limits/usage', {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setUsage(data.data);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load usage data');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentWorkspaceId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchUsage();

    // Connect to WebSocket channel for real-time updates
    if (window.Echo) {
      const channel = window.Echo.private(`workspace.${currentWorkspaceId}.limits`);

      channel.listen('.usage.limits.updated', (data: any) => {
        let usageData = null;

        if (data.limits?.success && data.limits.data) {
          usageData = data.limits.data;
        } else if (data.success && data.data) {
          usageData = data.data;
        } else if (data.plan && data.publications) {
          usageData = data;
        }

        if (usageData) {
          setUsage(usageData);
          setError(null);
        } else {
          fetchUsage();
        }
      });

      channel.error(() => {
        // silently ignore channel errors — fetchUsage runs on next user action
      });
    }

    // Listen for plan change events
    const handlePlanChanged = () => fetchUsage();

    // Listen for addon purchase events
    const handleAddonPurchased = () => fetchUsage();

    window.addEventListener('subscription-plan-changed', handlePlanChanged);
    window.addEventListener('addon-purchased', handleAddonPurchased);

    return () => {
      // Leave WebSocket channel
      if (window.Echo) {
        window.Echo.leave(`workspace.${currentWorkspaceId}.limits`);
      }

      window.removeEventListener('subscription-plan-changed', handlePlanChanged);
      window.removeEventListener('addon-purchased', handleAddonPurchased);
    };
  }, [currentWorkspaceId]);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
  };
}
