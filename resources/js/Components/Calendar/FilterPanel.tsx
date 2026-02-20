import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter, FaTimes } from 'react-icons/fa';
import { CalendarFilters, Platform, PublicationStatus } from '@/types/calendar';
import { Campaign } from '@/stores/campaignStore';
import { SOCIAL_PLATFORMS } from '@/Constants/socialPlatformsConfig';

interface FilterPanelProps {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  campaigns: Campaign[];
  totalEvents: number;
  filteredCount: number;
}

const AVAILABLE_STATUSES: PublicationStatus[] = [
  'draft',
  'published',
  'publishing',
  'failed',
  'pending_review',
  'approved',
  'scheduled',
  'rejected',
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  campaigns,
  totalEvents,
  filteredCount,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert SOCIAL_PLATFORMS to Platform array
  const platforms: Platform[] = Object.values(SOCIAL_PLATFORMS)
    .filter(p => p.active)
    .map(p => ({
      id: p.key,
      name: p.name,
      icon: p.logo,
    }));

  const hasActiveFilters = 
    filters.platforms.length > 0 || 
    filters.campaigns.length > 0 || 
    filters.statuses.length > 0;

  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = filters.platforms.includes(platformId)
      ? filters.platforms.filter(p => p !== platformId)
      : [...filters.platforms, platformId];
    
    onFiltersChange({ ...filters, platforms: newPlatforms });
  };

  const handleCampaignToggle = (campaignId: string) => {
    const newCampaigns = filters.campaigns.includes(campaignId)
      ? filters.campaigns.filter(c => c !== campaignId)
      : [...filters.campaigns, campaignId];
    
    onFiltersChange({ ...filters, campaigns: newCampaigns });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleClearAll = () => {
    onFiltersChange({
      platforms: [],
      campaigns: [],
      statuses: [],
    });
  };

  const getStatusLabel = (status: PublicationStatus): string => {
    const labels: Record<PublicationStatus, string> = {
      draft: t('status.draft', 'Draft'),
      published: t('status.published', 'Published'),
      publishing: t('status.publishing', 'Publishing'),
      failed: t('status.failed', 'Failed'),
      pending_review: t('status.pending_review', 'Pending Review'),
      approved: t('status.approved', 'Approved'),
      scheduled: t('status.scheduled', 'Scheduled'),
      rejected: t('status.rejected', 'Rejected'),
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: PublicationStatus): string => {
    const colors: Record<PublicationStatus, string> = {
      published: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      publishing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      approved: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
      scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <FaFilter className="text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('calendar.filters', 'Filters')}
          </h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
              {filters.platforms.length + filters.campaigns.length + filters.statuses.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('calendar.clear_all', 'Clear All')}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Results Counter */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('calendar.showing_filtered', 'Showing {{count}} of {{total}} events', {
              count: filteredCount,
              total: totalEvents,
            })}
          </p>
        </div>
      )}

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Platform Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('calendar.filter_by_platform', 'Platform')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${filters.platforms.includes(platform.id)
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Filters */}
          {campaigns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('calendar.filter_by_campaign', 'Campaign')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => handleCampaignToggle(campaign.id.toString())}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${filters.campaigns.includes(campaign.id.toString())
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 ring-2 ring-purple-500'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {campaign.name || campaign.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('calendar.filter_by_status', 'Status')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${filters.statuses.includes(status)
                      ? `${getStatusColor(status)} ring-2 ring-current`
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
