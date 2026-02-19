/**
 * Integration Tests: Empty States
 * 
 * This test suite validates:
 * - Empty state component rendering across all contexts
 * - Context-specific configurations
 * - Empty state mapper utility
 * - Accessibility compliance
 * - Responsive design
 * 
 * Requirements validated: 5.1-5.5, 6.1-6.5, 10.3-10.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState, { EmptyStateConfig } from '@/Components/common/EmptyState';
import { emptyStateConfigs } from '@/Constants/emptyStateConfigs';
import { getEmptyStateConfig } from '@/Utils/emptyStateMapper';
import { FileVideo, Calendar, BarChart3, Search, Plus } from 'lucide-react';

describe('Empty States - Integration Tests', () => {
  
  describe('1. Empty State Component Rendering', () => {
    
    it('should render all required elements: icon, title, description, CTA', () => {
      const mockConfig: EmptyStateConfig = {
        icon: <FileVideo data-testid="empty-icon" />,
        title: 'No content available',
        description: 'Start by creating your first piece of content',
        primaryAction: {
          label: 'Create Content',
          onClick: vi.fn(),
          icon: <Plus data-testid="cta-icon" />,
        }
      };
      
      render(<EmptyState config={mockConfig} />);
      
      // Verify icon is rendered
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
      
      // Verify title is rendered
      expect(screen.getByText('No content available')).toBeInTheDocument();
      
      // Verify description is rendered
      expect(screen.getByText('Start by creating your first piece of content')).toBeInTheDocument();
      
      // Verify primary CTA is rendered
      expect(screen.getByRole('button', { name: /Create Content/i })).toBeInTheDocument();
      expect(screen.getByTestId('cta-icon')).toBeInTheDocument();
    });

    it('should render with illustration instead of icon', () => {
      const mockConfig: EmptyStateConfig = {
        illustration: '/images/empty-state.svg',
        title: 'No data',
        description: 'No data available yet',
      };
      
      render(<EmptyState config={mockConfig} />);
      
      const illustration = screen.getByRole('img', { name: 'No data' });
      expect(illustration).toBeInTheDocument();
      expect(illustration).toHaveAttribute('src', '/images/empty-state.svg');
    });

    it('should render with secondary actions', () => {
      const primaryAction = vi.fn();
      const secondaryAction1 = vi.fn();
      const secondaryAction2 = vi.fn();
      
      const mockConfig: EmptyStateConfig = {
        icon: <FileVideo />,
        title: 'No content',
        description: 'Get started',
        primaryAction: {
          label: 'Primary Action',
          onClick: primaryAction,
        },
        secondaryActions: [
          {
            label: 'Secondary 1',
            onClick: secondaryAction1,
          },
          {
            label: 'Secondary 2',
            onClick: secondaryAction2,
          }
        ]
      };
      
      render(<EmptyState config={mockConfig} />);
      
      expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary 2' })).toBeInTheDocument();
    });

    it('should call onClick handlers when buttons are clicked', () => {
      const primaryOnClick = vi.fn();
      const secondaryOnClick = vi.fn();
      
      const mockConfig: EmptyStateConfig = {
        icon: <FileVideo />,
        title: 'No content',
        description: 'Get started',
        primaryAction: {
          label: 'Primary',
          onClick: primaryOnClick,
        },
        secondaryActions: [
          {
            label: 'Secondary',
            onClick: secondaryOnClick,
          }
        ]
      };
      
      render(<EmptyState config={mockConfig} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Primary' }));
      expect(primaryOnClick).toHaveBeenCalledTimes(1);
      
      fireEvent.click(screen.getByRole('button', { name: 'Secondary' }));
      expect(secondaryOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Context-Specific Configurations', () => {
    
    it('should have configuration for reels context', () => {
      expect(emptyStateConfigs.reels).toBeDefined();
      expect(emptyStateConfigs.reels.title).toBeTruthy();
      expect(emptyStateConfigs.reels.description).toBeTruthy();
      expect(emptyStateConfigs.reels.primaryAction).toBeDefined();
      expect(emptyStateConfigs.reels.primaryAction?.label).toContain('Reel');
    });

    it('should have configuration for scheduled posts context', () => {
      expect(emptyStateConfigs.scheduledPosts).toBeDefined();
      expect(emptyStateConfigs.scheduledPosts.title).toBeTruthy();
      expect(emptyStateConfigs.scheduledPosts.description).toBeTruthy();
      expect(emptyStateConfigs.scheduledPosts.primaryAction).toBeDefined();
      expect(emptyStateConfigs.scheduledPosts.primaryAction?.label).toContain('Post');
    });

    it('should have configuration for analytics context', () => {
      expect(emptyStateConfigs.analytics).toBeDefined();
      expect(emptyStateConfigs.analytics.title).toBeTruthy();
      expect(emptyStateConfigs.analytics.description).toBeTruthy();
      expect(emptyStateConfigs.analytics.primaryAction).toBeDefined();
    });

    it('should have configuration for search results context', () => {
      expect(emptyStateConfigs.searchResults).toBeDefined();
      expect(emptyStateConfigs.searchResults.title).toBeTruthy();
      expect(emptyStateConfigs.searchResults.description).toBeTruthy();
    });

    it('should have configuration for calendar view context', () => {
      expect(emptyStateConfigs.calendarView).toBeDefined();
      expect(emptyStateConfigs.calendarView.title).toBeTruthy();
      expect(emptyStateConfigs.calendarView.description).toBeTruthy();
      expect(emptyStateConfigs.calendarView.primaryAction).toBeDefined();
    });
  });

  describe('3. Empty State Mapper Utility', () => {
    
    it('should return correct config for reels route with empty data', () => {
      const props = { reels: [] };
      const config = getEmptyStateConfig('reels.gallery', props);
      
      expect(config).toBeDefined();
      expect(config?.title.toLowerCase()).toContain('reel');
    });

    it('should return null for reels route with data', () => {
      const props = { reels: [{ id: 1, title: 'Test Reel' }] };
      const config = getEmptyStateConfig('reels.gallery', props);
      
      expect(config).toBeNull();
    });

    it('should return correct config for publications route with empty data', () => {
      const props = { publications: [] };
      const config = getEmptyStateConfig('content.index', props);
      
      expect(config).toBeDefined();
      expect(config?.title).toBeTruthy();
    });

    it('should return null for publications route with data', () => {
      const props = { publications: [{ id: 1, title: 'Test Post' }] };
      const config = getEmptyStateConfig('content.index', props);
      
      expect(config).toBeNull();
    });

    it('should return correct config for analytics route with empty data', () => {
      const props = { analytics: [] };
      const config = getEmptyStateConfig('analytics.index', props);
      
      expect(config).toBeDefined();
      expect(config?.title.toLowerCase()).toContain('analytics');
    });

    it('should return correct config for calendar route with empty data', () => {
      const props = { events: [] };
      const config = getEmptyStateConfig('calendar.index', props);
      
      expect(config).toBeDefined();
    });

    it('should return null for unknown route', () => {
      const props = { data: [] };
      const config = getEmptyStateConfig('unknown.route', props);
      
      expect(config).toBeNull();
    });
  });

  describe('4. Accessibility Compliance', () => {
    
    it('should have alt text for illustration images', () => {
      const mockConfig: EmptyStateConfig = {
        illustration: '/images/empty.svg',
        title: 'Empty State Title',
        description: 'Description text',
      };
      
      render(<EmptyState config={mockConfig} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Empty State Title');
    });

    it('should use semantic HTML elements', () => {
      const mockConfig: EmptyStateConfig = {
        icon: <FileVideo />,
        title: 'Test Title',
        description: 'Test Description',
        primaryAction: {
          label: 'Test Action',
          onClick: vi.fn(),
        }
      };
      
      const { container } = render(<EmptyState config={mockConfig} />);
      
      // Should have heading for title
      expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
      
      // Should have button for action
      expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      const primaryOnClick = vi.fn();
      
      const mockConfig: EmptyStateConfig = {
        icon: <FileVideo />,
        title: 'Test',
        description: 'Test',
        primaryAction: {
          label: 'Action',
          onClick: primaryOnClick,
        }
      };
      
      render(<EmptyState config={mockConfig} />);
      
      const button = screen.getByRole('button', { name: 'Action' });
      
      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
      
      // Should trigger on Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: The actual Enter key handling is browser default behavior
    });
  });

  describe('5. Responsive Design', () => {
    
    it('should apply custom className', () => {
      const mockConfig: EmptyStateConfig = {
        icon: <FileVideo />,
        title: 'Test',
        description: 'Test',
      };
      
      const { container } = render(<EmptyState config={mockConfig} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render without crashing on mobile viewport', () => {
      // Simulate mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      const mockConfig: EmptyStateConfig = {
        icon: <FileVideo />,
        title: 'Mobile Test',
        description: 'Testing mobile rendering',
        primaryAction: {
          label: 'Action',
          onClick: vi.fn(),
        }
      };
      
      expect(() => render(<EmptyState config={mockConfig} />)).not.toThrow();
      expect(screen.getByText('Mobile Test')).toBeInTheDocument();
    });
  });

  describe('6. Integration with All Contexts', () => {
    
    it('should render reels empty state correctly', () => {
      render(<EmptyState config={emptyStateConfigs.reels} />);
      
      expect(screen.getAllByText(/reel/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render scheduled posts empty state correctly', () => {
      render(<EmptyState config={emptyStateConfigs.scheduledPosts} />);
      
      expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render analytics empty state correctly', () => {
      render(<EmptyState config={emptyStateConfigs.analytics} />);
      
      expect(screen.getAllByText(/analytics/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render search results empty state correctly', () => {
      render(<EmptyState config={emptyStateConfigs.searchResults} />);
      
      expect(screen.getByText(/results/i)).toBeInTheDocument();
    });

    it('should render calendar view empty state correctly', () => {
      render(<EmptyState config={emptyStateConfigs.calendarView} />);
      
      expect(screen.getByText(/calendar/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
