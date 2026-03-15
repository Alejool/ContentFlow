import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

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
  ai_requests: {
    used: number;
    limit: number | null;
    total_available: number | null;
    remaining: number | null;
    percentage: number;
    limit_reached: boolean;
    addon_info?: {
      total: number;
      used: number;
      remaining: number;
    };
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

      const response = await fetch("/api/v1/subscription/limits/usage", {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
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
      console.error("[useSubscriptionUsage] Error fetching usage:", err);
      setError(err.message || "Failed to load usage data");
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
      console.log(
        "[useSubscriptionUsage] Connecting to channel:",
        `workspace.${currentWorkspaceId}.limits`,
      );
      const channel = window.Echo.private(
        `workspace.${currentWorkspaceId}.limits`,
      );

      // Try listening with the dot notation (Laravel default)
      console.log(
        "[useSubscriptionUsage] Listening for event:",
        ".usage.limits.updated",
      );
      channel.listen(".usage.limits.updated", (data: any) => {
        console.log(
          "[useSubscriptionUsage] ✅ WebSocket event received (dot notation):",
          data,
        );
        console.log(
          "[useSubscriptionUsage] Full data structure:",
          JSON.stringify(data, null, 2),
        );

        // Try different data structures
        let usageData = null;

        // Structure 1: data.limits.data (expected)
        if (data.limits?.success && data.limits.data) {
          usageData = data.limits.data;
          console.log(
            "[useSubscriptionUsage] Using structure 1: data.limits.data",
          );
        }
        // Structure 2: data.data (alternative)
        else if (data.success && data.data) {
          usageData = data.data;
          console.log("[useSubscriptionUsage] Using structure 2: data.data");
        }
        // Structure 3: data directly
        else if (data.plan && data.publications) {
          usageData = data;
          console.log(
            "[useSubscriptionUsage] Using structure 3: data directly",
          );
        }

        if (usageData) {
          console.log("[useSubscriptionUsage] Updating usage with:", usageData);
          setUsage(usageData);
          setError(null);
        } else {
          console.warn(
            "[useSubscriptionUsage] Could not find valid usage data in:",
            data,
          );
          // Fallback: refetch from API
          console.log("[useSubscriptionUsage] Falling back to API fetch");
          fetchUsage();
        }
      });

      channel.subscribed(() => {
        console.log(
          "[useSubscriptionUsage] ✅ WebSocket channel subscribed successfully",
        );
        console.log(
          "[useSubscriptionUsage] Channel name:",
          `workspace.${currentWorkspaceId}.limits`,
        );
        console.log(
          "[useSubscriptionUsage] Listening for:",
          "usage.limits.updated",
        );
      });

      channel.error((error: any) => {
        console.error(
          "[useSubscriptionUsage] ❌ WebSocket channel error:",
          error,
        );
      });

      // Listen to ALL events on this channel for debugging
      channel.listenToAll((eventName: string, data: any) => {
        console.log(
          "[useSubscriptionUsage] 🔔 ANY EVENT received:",
          eventName,
          data,
        );
      });
    } else {
      console.warn(
        "[useSubscriptionUsage] Echo not available, WebSocket updates disabled",
      );
    }

    // Listen for plan change events
    const handlePlanChanged = () => {
      console.log(
        "[useSubscriptionUsage] Plan changed, refetching immediately...",
      );
      // Refetch inmediatamente sin delay
      fetchUsage();
    };

    // Listen for addon purchase events
    const handleAddonPurchased = () => {
      console.log("[useSubscriptionUsage] Addon purchased, refetching...");
      fetchUsage();
    };

    window.addEventListener("subscription-plan-changed", handlePlanChanged);
    window.addEventListener("addon-purchased", handleAddonPurchased);

    return () => {
      // Leave WebSocket channel
      if (window.Echo) {
        window.Echo.leave(`workspace.${currentWorkspaceId}.limits`);
      }

      window.removeEventListener(
        "subscription-plan-changed",
        handlePlanChanged,
      );
      window.removeEventListener("addon-purchased", handleAddonPurchased);
    };
  }, [currentWorkspaceId]);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
  };
}
