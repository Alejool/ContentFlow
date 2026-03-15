import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Campaign {
  id: number;
  name: string;
  title?: string;
  description?: string;
  goal?: string;
  budget?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "paused" | "completed";
  created_at?: string;
  updated_at?: string;
}

interface CampaignListResponse {
  data: Campaign[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

async function fetchCampaignsFn(
  filters: Record<string, any>,
  page: number,
): Promise<CampaignListResponse> {
  const response = await axios.get(route("api.v1.campaigns.index"), {
    params: { ...filters, page },
  });

  const raw = response.data?.campaigns;

  // Normalize paginated vs flat response shapes from the API
  if (raw?.data) {
    return {
      data: raw.data,
      current_page: raw.current_page ?? 1,
      last_page: raw.last_page ?? 1,
      total: raw.total ?? 0,
      per_page: raw.per_page ?? 10,
    };
  }

  const list: Campaign[] = Array.isArray(raw) ? raw : (response.data?.data ?? []);
  return {
    data: list,
    current_page: response.data?.current_page ?? 1,
    last_page: response.data?.last_page ?? 1,
    total: response.data?.total ?? list.length,
    per_page: response.data?.per_page ?? 10,
  };
}

/**
 * Fetch a paginated, filtered list of campaigns.
 */
export function useCampaignsList(filters: Record<string, any> = {}, page = 1) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters, page),
    queryFn: () => fetchCampaignsFn(filters, page),
    staleTime: 2 * 60 * 1000, // 2 min — campaigns don't change that often
    placeholderData: (prev) => prev, // keep previous page data while loading next
  });
}

/**
 * Delete a campaign and invalidate the campaigns cache.
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => axios.delete(route("api.v1.campaigns.destroy", id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

/**
 * Duplicate a campaign and invalidate the campaigns cache.
 */
export function useDuplicateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      axios.post(route("api.v1.campaigns.duplicate", id)).then((r) => r.data?.campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
  });
}

/**
 * Legacy-compatible hook — wraps useCampaignsList for components
 * that still expect the old { campaigns, loading, fetchCampaigns } shape.
 * @deprecated Migrate consumers to useCampaignsList directly.
 */
export const useCampaigns = () => {
  const { data, isLoading, refetch } = useCampaignsList();
  return {
    campaigns: data?.data ?? [],
    loading: isLoading,
    fetchCampaigns: refetch,
  };
};
