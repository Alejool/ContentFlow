import { ApprovalRequest } from "@/types/ApprovalTypes";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

interface UsePendingApprovalsReturn {
  requests: ApprovalRequest[];
  isLoading: boolean;
  refresh: () => void;
}

export function usePendingApprovals(
  refreshTrigger?: number
): UsePendingApprovalsReturn {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(route("api.v1.approvals.pending"));
      setRequests(response.data.requests ?? []);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending, refreshTrigger]);

  return { requests, isLoading, refresh: fetchPending };
}
