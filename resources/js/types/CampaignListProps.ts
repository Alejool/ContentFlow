import type { Campaign } from '@/types/Campaign';
import type { Publication } from '@/types/Publication';

export type CampaignListProps = {
  items: (Campaign | Publication)[];
  mode: 'campaigns' | 'publications';
  onEdit: (item: Campaign | Publication) => void;
  onDelete: (itemId: number) => void;
  onAdd: () => void;
  onPublish: (item: Campaign | Publication) => void;
  onViewDetails: (item: Campaign | Publication) => void;
  isLoading: boolean;
  onFilterChange?: (filters: Record<string, unknown>) => void;
  onRefresh?: () => void;
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onEditRequest?: (item: Campaign | Publication) => void;
  onDuplicate?: (id: number) => void;
  connectedAccounts?: import('@/types/SocialAccount').SocialAccount[];
  onForceRefresh?: () => void;
  onResetFilters?: () => void;
};
