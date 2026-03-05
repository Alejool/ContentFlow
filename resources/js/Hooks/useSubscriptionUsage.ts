import { useEffect, useState } from 'react';
import axios from 'axios';

interface UsageData {
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
    remaining: number;
    percentage: number;
    limit_reached: boolean;
  };
  storage: {
    used_bytes: number;
    used_mb: number;
    used_gb: number;
    limit_bytes: number;
    limit_gb: number;
    remaining_bytes: number;
    percentage: number;
    limit_reached: boolean;
  };
  social_accounts: {
    used: number;
    limit: number;
  };
  ai_requests: {
    used: number;
    limit: number | null;
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

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(route('api.v1.subscription.current-usage'), {
        // Add timestamp to prevent caching
        params: { _t: Date.now() }
      });
      
      if (response.data.success) {
        setUsage(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch usage data');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No active subscription - this is okay, just set usage to null
        setUsage(null);
      } else {
        setError(err.response?.data?.message || 'Error fetching usage data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();

    // Listen for plan change events
    const handlePlanChanged = () => {
      fetchUsage();
    };

    window.addEventListener('subscription-plan-changed', handlePlanChanged);

    // Refetch usage every 30 seconds to catch plan changes
    const interval = setInterval(() => {
      fetchUsage();
    }, 30000);

    return () => {
      window.removeEventListener('subscription-plan-changed', handlePlanChanged);
      clearInterval(interval);
    };
  }, []);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
  };
}
