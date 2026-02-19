import { router } from '@inertiajs/react';
import {
  BarChart3,
  Calendar,
  FileVideo,
  Search,
  Plus,
  FileText,
} from 'lucide-react';
import { TFunction } from 'i18next';
import { EmptyStateConfig } from '@/Components/common/EmptyState';

/**
 * Empty State Configurations
 * 
 * Defines contextually relevant empty state configurations for different
 * sections of the application. Each configuration includes an icon,
 * descriptive messaging, and appropriate call-to-action buttons.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

/**
 * Get empty state configurations with translations
 * @param t - Translation function from i18next
 * @returns Record of empty state configurations
 */
export const getEmptyStateConfigs = (t: TFunction): Record<string, EmptyStateConfig> => ({
  /**
   * Empty state for reels list
   * Requirement 6.1: Reel-specific messaging and "Create Reel" CTA
   */
  reels: {
    icon: <FileVideo className="w-full h-full" />,
    title: t('common.emptyState.reels.title'),
    description: t('common.emptyState.reels.description'),
    primaryAction: {
      label: t('common.emptyState.reels.action'),
      onClick: () => router.visit('/reels'),
      icon: <Plus className="w-4 h-4" />,
    },
  },

  /**
   * Empty state for scheduled posts list
   * Requirement 6.2: Scheduling-specific messaging and "Schedule Post" CTA
   */
  scheduledPosts: {
    icon: <Calendar className="w-full h-full" />,
    title: t('common.emptyState.scheduledPosts.title'),
    description: t('common.emptyState.scheduledPosts.description'),
    primaryAction: {
      label: t('common.emptyState.scheduledPosts.action'),
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },

  /**
   * Empty state for analytics view
   * Requirement 6.3: Analytics-specific messaging explaining data requirements
   */
  analytics: {
    icon: <BarChart3 className="w-full h-full" />,
    title: t('common.emptyState.analytics.title'),
    description: t('common.emptyState.analytics.description'),
    primaryAction: {
      label: t('common.emptyState.analytics.action'),
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },

  /**
   * Empty state for search results
   * Requirement 6.4: Search-specific messaging with suggestions to refine search
   */
  searchResults: {
    icon: <Search className="w-full h-full" />,
    title: t('common.emptyState.searchResults.title'),
    description: t('common.emptyState.searchResults.description'),
    secondaryActions: [
      {
        label: t('common.emptyState.searchResults.action'),
        onClick: () => {
          // Clear filters logic - to be implemented by consuming component
          window.dispatchEvent(new CustomEvent('clearFilters'));
        },
      },
    ],
  },

  /**
   * Empty state for calendar view
   * Requirement 6.5: Calendar-specific messaging and "Schedule Content" CTA
   */
  calendarView: {
    icon: <Calendar className="w-full h-full" />,
    title: t('common.emptyState.calendarView.title'),
    description: t('common.emptyState.calendarView.description'),
    primaryAction: {
      label: t('common.emptyState.calendarView.action'),
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },

  /**
   * Empty state for general content list
   * Used as fallback for content-related empty states
   */
  content: {
    icon: <FileText className="w-full h-full" />,
    title: t('common.emptyState.content.title'),
    description: t('common.emptyState.content.description'),
    primaryAction: {
      label: t('common.emptyState.content.action'),
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },
});

/**
 * Legacy export for backward compatibility
 * @deprecated Use getEmptyStateConfigs(t) instead
 */
export const emptyStateConfigs: Record<string, EmptyStateConfig> = {
  reels: {
    icon: <FileVideo className="w-full h-full" />,
    title: 'No reels yet',
    description:
      'Create your first reel to start engaging with your audience through short-form video content.',
    primaryAction: {
      label: 'Create Reel',
      onClick: () => router.visit('/reels'),
      icon: <Plus className="w-4 h-4" />,
    },
  },
  scheduledPosts: {
    icon: <Calendar className="w-full h-full" />,
    title: 'No scheduled posts',
    description:
      'Schedule your content in advance to maintain a consistent posting schedule across all platforms.',
    primaryAction: {
      label: 'Schedule Post',
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },
  analytics: {
    icon: <BarChart3 className="w-full h-full" />,
    title: 'No analytics data available',
    description:
      'Analytics will appear here once you start publishing content and gathering engagement data.',
    primaryAction: {
      label: 'Create First Post',
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },
  searchResults: {
    icon: <Search className="w-full h-full" />,
    title: 'No results found',
    description:
      "Try adjusting your search terms or filters to find what you're looking for.",
    secondaryActions: [
      {
        label: 'Clear Filters',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('clearFilters'));
        },
      },
    ],
  },
  calendarView: {
    icon: <Calendar className="w-full h-full" />,
    title: 'No content scheduled',
    description:
      'Your calendar is empty. Start scheduling content to see it appear here.',
    primaryAction: {
      label: 'Schedule Content',
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },
  content: {
    icon: <FileText className="w-full h-full" />,
    title: 'No content yet',
    description:
      'Start creating content to manage and schedule your social media posts.',
    primaryAction: {
      label: 'Create Content',
      onClick: () => router.visit('/content'),
      icon: <Plus className="w-4 h-4" />,
    },
  },
};
