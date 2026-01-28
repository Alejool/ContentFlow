import { Campaign } from "@/types/Campaign";
import { Publication } from "@/types/Publication";

export type CampaignListProps = {
  items: (Campaign | Publication)[];
  mode: "campaigns" | "publications";
  onEdit: (item: any) => void;
  onDelete: (itemId: number) => void;
  onAdd: () => void;
  onPublish: (item: any) => void;
  onViewDetails: (item: any) => void;
  isLoading: boolean;
  onFilterChange?: (filters: any) => void;
  onRefresh?: () => void;
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  onPageChange: (page: number) => void;
  onEditRequest?: (item: any) => void;
  connectedAccounts?: any[];
  onForceRefresh?: () => void;
};
