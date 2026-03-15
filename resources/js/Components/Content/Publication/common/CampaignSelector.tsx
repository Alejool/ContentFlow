import SearchableSelector from '@/Components/common/Modern/SearchableSelector';
import { formatDate as formatDateHelper } from '@/Utils/i18nHelpers';
import { Calendar, Target } from 'lucide-react';
import React from 'react';

interface Campaign {
  id: number;
  name: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedId: number | null;
  loading?: boolean;
  t: (key: string) => string;
  onSelectCampaign: (id: number | null) => void;
  disabled?: boolean;
  maxHeight?: string;
}

const CampaignSelector: React.FC<CampaignSelectorProps> = ({
  campaigns,
  selectedId,
  loading = false,
  t,
  onSelectCampaign,
  disabled = false,
  maxHeight,
}) => {
  const handleToggle = (id: number) => {
    // If clicking the same campaign, deselect it
    if (selectedId === id) {
      onSelectCampaign(null);
    } else {
      onSelectCampaign(id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return formatDateHelper(date, 'medium');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
        {t('common.loading') || 'Loading...'}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('publications.modal.add.noCampaigns') || 'No campaigns available'}
      </div>
    );
  }

  return (
    <SearchableSelector
      items={campaigns}
      selectedIds={selectedId !== null ? [selectedId] : []}
      onToggle={handleToggle}
      loading={loading}
      mode="single"
      searchPlaceholder={t('common.search') || 'Search campaigns...'}
      emptyMessage={t('publications.modal.add.noCampaigns') || 'No campaigns available'}
      noResultsMessage={t('common.noResults') || 'No campaigns found'}
      getItemId={(campaign) => campaign.id}
      getSearchableText={(campaign) => campaign.name || campaign.title || ''}
      disabled={disabled}
      maxHeight={maxHeight}
      renderItem={(campaign, isSelected) => {
        const startDate = formatDate(campaign.start_date);
        const endDate = formatDate(campaign.end_date);
        const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : '';

        return (
          <div
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
              disabled ? 'cursor-not-allowed opacity-60' : ''
            } ${
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-500/20 dark:bg-primary-900/20'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/50'
            }`}
          >
            {/* Icon */}
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-neutral-700 dark:text-gray-400'
              }`}
            >
              <Target className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-semibold ${
                  isSelected
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {campaign.name || campaign.title || 'Untitled Campaign'}
              </p>

              {dateRange && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{dateRange}</span>
                </div>
              )}

              {campaign.status && (
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      campaign.status.toLowerCase() === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : campaign.status.toLowerCase() === 'completed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              )}
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <div className="flex-shrink-0">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

export default CampaignSelector;
