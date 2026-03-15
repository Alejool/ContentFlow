import { ApprovalRequest } from "@/types/ApprovalTypes";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

interface UsePendingApprovalsReturn {
  requests: ApprovalRequest[];
  isLoading: boolean;
  refresh: () => void;
}

export function usePendingApprovals(
  refreshTrigger?: number,
): UsePendingApprovalsReturn {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    console.log("[usePendingApprovals] Fetching pending approvals...");
    setIsLoading(true);
    try {
      const response = await axios.get(route("api.v1.approvals.pending"), {
        params: {
          type: "to_approve", // Explicitly request approvals to review
        },
      });
      console.log("[usePendingApprovals] Received:", response.data);
      setRequests(response.data.requests ?? []);
    } catch (error) {
      console.error("[usePendingApprovals] Error fetching:", error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log(
      "[usePendingApprovals] Effect triggered, refreshTrigger:",
      refreshTrigger,
    );
    fetchPending();
  }, [fetchPending, refreshTrigger]);

  return { requests, isLoading, refresh: fetchPending };
}
