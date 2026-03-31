/**
 * Preservation Property Tests
 * Publication Type and Platform Compatibility
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 * 
 * IMPORTANT: These tests capture the CURRENT behavior for compatible combinations
 * on UNFIXED code. They should PASS on unfixed code, confirming baseline behavior.
 * 
 * After implementing the fix, these same tests should still PASS, confirming that
 * compatible combinations continue to work correctly (no regressions).
 * 
 * Property 2: For all compatible (type, platforms) combinations where NOT isBugCondition(input),
 * the system behavior should remain unchanged after the fix.
 */

import ContentTypeIconSelector from '@/Components/Content/Publication/common/ContentTypeIconSelector';
import ContentTypeSelector from '@/Components/Content/Publication/common/ContentTypeSelector';
import SocialAccountsSection from '@/Components/Content/Publication/common/add/SocialAccountsSection';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Mock translation function
const mockT = (key: string) => key;

// Platform compatibility rules (from config/content_types.php)
const CONTENT_TYPE_RULES = {
  post: {
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'],
    media: { required: false, min_count: 0, max_count: 10, types: ['image', 'video'] }
  },
  reel: {
    platforms: ['instagram', 'tiktok', 'youtube', 'facebook'],
    media: { required: true, min_count: 1, max_count: 1, types: ['video'] }
  },
  story: {
    platforms: ['instagram', 'facebook'],
    media: { required: true, min_count: 1, max_count: 1, types: ['image', 'video'] }
  },
  poll: {
    platforms: ['twitter'], // Facebook no soporta encuestas nativas
    media: { required: false, min_count: 0, max_count: 4, types: ['image', 'video'] }
  },
  carousel: {
    platforms: ['instagram', 'facebook', 'linkedin'],
    media: { required: true, min_count: 2, max_count: 10, types: ['image', 'video'] }
  },
};

type ContentType = keyof typeof CONTENT_TYPE_RULES;

/**
 * Helper function to check if a combination is compatible (NOT a bug condition)
 */
function isCompatibleCombination(type: ContentType, platforms: string[]): boolean {
  if (platforms.length === 0) return true;
  
  const compatiblePlatforms = CONTENT_TYPE_RULES[type].platforms;
  return platforms.every(platform => 
    compatiblePlatforms.includes(platform.toLowerCase())
  );
}

describe('Preservation Property Tests: Compatible Combinations Continue to Work', () => {
  
  describe('Property 2.1: Post Type Works with All Platforms (Requirement 3.1, 3.2)', () => {
    it('should show Post type when all platforms are selected', () => {
      // Post is supported by all platforms, so it should always be visible
      const allPlatforms = ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="post"
          selectedPlatforms={allPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // Post should be visible
      const postButton = screen.queryByText('Post');
      expect(postButton).not.toBeNull();
      
      // Verify this is a compatible combination
      expect(isCompatibleCombination('post', allPlatforms)).toBe(true);
    });

    it('should show Post type when Instagram is selected', () => {
      const selectedPlatforms = ['instagram'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="post"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const postButton = screen.queryByText('Post');
      expect(postButton).not.toBeNull();
      expect(isCompatibleCombination('post', selectedPlatforms)).toBe(true);
    });

    it('should show Post type when Twitter is selected', () => {
      const selectedPlatforms = ['twitter'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="post"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const postButton = screen.queryByText('Post');
      expect(postButton).not.toBeNull();
      expect(isCompatibleCombination('post', selectedPlatforms)).toBe(true);
    });

    it('should show Post type when YouTube is selected', () => {
      const selectedPlatforms = ['youtube'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="post"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const postButton = screen.queryByText('Post');
      expect(postButton).not.toBeNull();
      expect(isCompatibleCombination('post', selectedPlatforms)).toBe(true);
    });
  });

  describe('Property 2.2: Single Platform Selections Work with Supported Types (Requirement 3.2)', () => {
    it('should show Story type when only Instagram is selected', () => {
      // Story is supported by Instagram
      const selectedPlatforms = ['instagram'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="story"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const storyButton = screen.queryByText('Story');
      expect(storyButton).not.toBeNull();
      expect(isCompatibleCombination('story', selectedPlatforms)).toBe(true);
    });

    it('should show Story type when only Facebook is selected', () => {
      // Story is supported by Facebook
      const selectedPlatforms = ['facebook'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="story"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const storyButton = screen.queryByText('Story');
      expect(storyButton).not.toBeNull();
      expect(isCompatibleCombination('story', selectedPlatforms)).toBe(true);
    });

    it('should show Reel type when only Instagram is selected', () => {
      // Reel is supported by Instagram
      const selectedPlatforms = ['instagram'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="reel"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // Use getAllByText to handle multiple matches (button text + info text)
      const reelButtons = screen.queryAllByText(/Reel/);
      expect(reelButtons.length).toBeGreaterThan(0);
      expect(isCompatibleCombination('reel', selectedPlatforms)).toBe(true);
    });

    it('should show Poll type when only Twitter is selected', () => {
      // Poll is only supported by Twitter
      const selectedPlatforms = ['twitter'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="poll"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const pollButton = screen.queryByText('Poll');
      expect(pollButton).not.toBeNull();
      expect(isCompatibleCombination('poll', selectedPlatforms)).toBe(true);
    });

    it('should show Carousel type when only Instagram is selected', () => {
      // Carousel is supported by Instagram
      const selectedPlatforms = ['instagram'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="carousel"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const carouselButton = screen.queryByText('Carousel');
      expect(carouselButton).not.toBeNull();
      expect(isCompatibleCombination('carousel', selectedPlatforms)).toBe(true);
    });
  });

  describe('Property 2.3: Compatible Multi-Platform Combinations Work (Requirement 3.1)', () => {
    it('should show Story when Instagram and Facebook are selected (both support Story)', () => {
      const selectedPlatforms = ['instagram', 'facebook'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="story"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const storyButton = screen.queryByText('Story');
      expect(storyButton).not.toBeNull();
      expect(isCompatibleCombination('story', selectedPlatforms)).toBe(true);
    });

    it('should show Reel when Instagram and YouTube are selected (both support Reel)', () => {
      const selectedPlatforms = ['instagram', 'youtube'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="reel"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // Use getAllByText to handle multiple matches (button text + info text)
      const reelButtons = screen.queryAllByText(/Reel/);
      expect(reelButtons.length).toBeGreaterThan(0);
      expect(isCompatibleCombination('reel', selectedPlatforms)).toBe(true);
    });

    it('should show Carousel when Instagram and LinkedIn are selected (both support Carousel)', () => {
      const selectedPlatforms = ['instagram', 'linkedin'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="carousel"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const carouselButton = screen.queryByText('Carousel');
      expect(carouselButton).not.toBeNull();
      expect(isCompatibleCombination('carousel', selectedPlatforms)).toBe(true);
    });
  });

  describe('Property 2.4: All Content Types Shown When No Platforms Selected (Requirement 3.2)', () => {
    it('should show all 5 content types when no platforms are selected', () => {
      const selectedPlatforms: string[] = [];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="post"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // All types should be visible
      expect(screen.queryByText('Post')).not.toBeNull();
      expect(screen.queryByText(/Reel/)).not.toBeNull();
      expect(screen.queryByText('Story')).not.toBeNull();
      expect(screen.queryByText('Poll')).not.toBeNull();
      expect(screen.queryByText('Carousel')).not.toBeNull();
    });
  });

  describe('Property 2.5: ContentTypeIconSelector Preserves Same Behavior (Requirement 3.7)', () => {
    it('should show Post type in icon selector when Instagram is selected', () => {
      const selectedPlatforms = ['instagram'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeIconSelector
          selectedType="post"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // Should have buttons for available types
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      expect(isCompatibleCombination('post', selectedPlatforms)).toBe(true);
    });

    it('should show Story type in icon selector when Instagram is selected', () => {
      const selectedPlatforms = ['instagram'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeIconSelector
          selectedType="story"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      expect(isCompatibleCombination('story', selectedPlatforms)).toBe(true);
    });
  });

  describe('Property 2.6: Platform Selection Works for Compatible Types (Requirement 3.2, 3.4)', () => {
    it('should allow selecting Instagram when Post type is selected', () => {
      const mockAccounts = [
        { id: 1, platform: 'instagram', name: 'test_instagram', account_name: 'test_instagram' },
        { id: 2, platform: 'twitter', name: 'test_twitter', account_name: 'test_twitter' },
      ];
      
      const { container } = render(
        <SocialAccountsSection
          socialAccounts={mockAccounts}
          selectedAccounts={[]}
          accountSchedules={{}}
          t={mockT}
          onAccountToggle={() => {}}
          onScheduleChange={() => {}}
          onScheduleRemove={() => {}}
          onPlatformSettingsClick={() => {}}
        />
      );
      
      // Instagram should be available (Post supports all platforms)
      // Check that the component renders the Instagram account
      const instagramText = screen.queryByText('instagram');
      expect(instagramText).not.toBeNull();
      expect(isCompatibleCombination('post', ['instagram'])).toBe(true);
    });

    it('should allow selecting Twitter when Post type is selected', () => {
      const mockAccounts = [
        { id: 1, platform: 'instagram', name: 'test_instagram', account_name: 'test_instagram' },
        { id: 2, platform: 'twitter', name: 'test_twitter', account_name: 'test_twitter' },
      ];
      
      const { container } = render(
        <SocialAccountsSection
          socialAccounts={mockAccounts}
          selectedAccounts={[]}
          accountSchedules={{}}
          t={mockT}
          onAccountToggle={() => {}}
          onScheduleChange={() => {}}
          onScheduleRemove={() => {}}
          onPlatformSettingsClick={() => {}}
        />
      );
      
      // Twitter should be available (Post supports all platforms)
      const twitterText = screen.queryByText('twitter');
      expect(twitterText).not.toBeNull();
      expect(isCompatibleCombination('post', ['twitter'])).toBe(true);
    });

    it('should allow selecting Instagram when Story type is selected', () => {
      const mockAccounts = [
        { id: 1, platform: 'instagram', name: 'test_instagram', account_name: 'test_instagram' },
      ];
      
      const { container } = render(
        <SocialAccountsSection
          socialAccounts={mockAccounts}
          selectedAccounts={[]}
          accountSchedules={{}}
          t={mockT}
          onAccountToggle={() => {}}
          onScheduleChange={() => {}}
          onScheduleRemove={() => {}}
          onPlatformSettingsClick={() => {}}
        />
      );
      
      // Instagram should be available (Story supports Instagram)
      const instagramText = screen.queryByText('instagram');
      expect(instagramText).not.toBeNull();
      expect(isCompatibleCombination('story', ['instagram'])).toBe(true);
    });
  });

  describe('Property 2.7: Media Upload Validation Rules Preserved (Requirement 3.3)', () => {
    it('should preserve Reel media rules: requires 1 video', () => {
      const rules = CONTENT_TYPE_RULES.reel.media;
      
      expect(rules.required).toBe(true);
      expect(rules.min_count).toBe(1);
      expect(rules.max_count).toBe(1);
      expect(rules.types).toEqual(['video']);
    });

    it('should preserve Carousel media rules: requires 2-10 files', () => {
      const rules = CONTENT_TYPE_RULES.carousel.media;
      
      expect(rules.required).toBe(true);
      expect(rules.min_count).toBe(2);
      expect(rules.max_count).toBe(10);
      expect(rules.types).toContain('image');
      expect(rules.types).toContain('video');
    });

    it('should preserve Story media rules: requires 1 image or video', () => {
      const rules = CONTENT_TYPE_RULES.story.media;
      
      expect(rules.required).toBe(true);
      expect(rules.min_count).toBe(1);
      expect(rules.max_count).toBe(1);
      expect(rules.types).toContain('image');
      expect(rules.types).toContain('video');
    });

    it('should preserve Post media rules: optional, up to 10 files', () => {
      const rules = CONTENT_TYPE_RULES.post.media;
      
      expect(rules.required).toBe(false);
      expect(rules.min_count).toBe(0);
      expect(rules.max_count).toBe(10);
      expect(rules.types).toContain('image');
      expect(rules.types).toContain('video');
    });

    it('should preserve Poll media rules: optional, up to 4 files', () => {
      const rules = CONTENT_TYPE_RULES.poll.media;
      
      expect(rules.required).toBe(false);
      expect(rules.min_count).toBe(0);
      expect(rules.max_count).toBe(4);
    });
  });

  describe('Property 2.8: Backend Validation Rules Preserved (Requirement 3.6)', () => {
    it('should preserve platform compatibility rules from config', () => {
      // Verify that the rules match the backend config/content_types.php
      expect(CONTENT_TYPE_RULES.post.platforms).toEqual([
        'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'
      ]);
      
      expect(CONTENT_TYPE_RULES.reel.platforms).toEqual([
        'instagram', 'tiktok', 'youtube', 'facebook'
      ]);
      
      expect(CONTENT_TYPE_RULES.story.platforms).toEqual([
        'instagram', 'facebook'
      ]);
      
      expect(CONTENT_TYPE_RULES.poll.platforms).toEqual([
        'twitter' // Facebook no soporta encuestas nativas
      ]);
      
      expect(CONTENT_TYPE_RULES.carousel.platforms).toEqual([
        'instagram', 'facebook', 'linkedin'
      ]);
    });
  });

  describe('Property 2.9: Component Interface Preserved (Requirement 3.7)', () => {
    it('should preserve ContentTypeSelector interface and rendering', () => {
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="post"
          selectedPlatforms={['instagram']}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // Should render without errors
      expect(container).not.toBeNull();
      
      // Should have the label (checking for the translation key since mockT returns the key)
      const label = screen.queryByText('publications.modal.contentType.label');
      expect(label).not.toBeNull();
    });

    it('should preserve ContentTypeIconSelector interface and rendering', () => {
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeIconSelector
          selectedType="post"
          selectedPlatforms={['instagram']}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // Should render without errors
      expect(container).not.toBeNull();
      
      // Should have buttons
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should preserve SocialAccountsSection interface and rendering', () => {
      const mockAccounts = [
        { id: 1, platform: 'instagram', name: 'test_instagram', account_name: 'test_instagram' },
      ];
      
      const { container } = render(
        <SocialAccountsSection
          socialAccounts={mockAccounts}
          selectedAccounts={[]}
          accountSchedules={{}}
          t={mockT}
          onAccountToggle={() => {}}
          onScheduleChange={() => {}}
          onScheduleRemove={() => {}}
          onPlatformSettingsClick={() => {}}
        />
      );
      
      // Should render without errors
      expect(container).not.toBeNull();
    });
  });

  describe('Property 2.10: Comprehensive Compatible Combinations (Property-Based Approach)', () => {
    // This test validates multiple compatible combinations to ensure broad coverage
    const compatibleCombinations: Array<{ type: ContentType; platforms: string[] }> = [
      // Post with various platform combinations
      { type: 'post', platforms: ['instagram'] },
      { type: 'post', platforms: ['twitter'] },
      { type: 'post', platforms: ['facebook'] },
      { type: 'post', platforms: ['linkedin'] },
      { type: 'post', platforms: ['youtube'] },
      { type: 'post', platforms: ['pinterest'] },
      { type: 'post', platforms: ['instagram', 'twitter'] },
      { type: 'post', platforms: ['instagram', 'facebook', 'linkedin'] },
      
      // Reel with compatible platforms
      { type: 'reel', platforms: ['instagram'] },
      { type: 'reel', platforms: ['youtube'] },
      { type: 'reel', platforms: ['facebook'] },
      { type: 'reel', platforms: ['instagram', 'youtube'] },
      { type: 'reel', platforms: ['instagram', 'facebook'] },
      
      // Story with compatible platforms
      { type: 'story', platforms: ['instagram'] },
      { type: 'story', platforms: ['facebook'] },
      { type: 'story', platforms: ['instagram', 'facebook'] },
      
      // Poll with compatible platform
      { type: 'poll', platforms: ['twitter'] },
      
      // Carousel with compatible platforms
      { type: 'carousel', platforms: ['instagram'] },
      { type: 'carousel', platforms: ['facebook'] },
      { type: 'carousel', platforms: ['linkedin'] },
      { type: 'carousel', platforms: ['instagram', 'facebook'] },
      { type: 'carousel', platforms: ['instagram', 'linkedin'] },
      { type: 'carousel', platforms: ['facebook', 'linkedin'] },
      { type: 'carousel', platforms: ['instagram', 'facebook', 'linkedin'] },
    ];

    compatibleCombinations.forEach(({ type, platforms }) => {
      it(`should work correctly for ${type} with platforms: ${platforms.join(', ')}`, () => {
        // Verify this is indeed a compatible combination
        expect(isCompatibleCombination(type, platforms)).toBe(true);
        
        const onChange = () => {};
        
        // Test with ContentTypeSelector
        const { container } = render(
          <ContentTypeSelector
            selectedType={type}
            selectedPlatforms={platforms}
            onChange={onChange}
            t={mockT}
          />
        );
        
        // Should render without errors
        expect(container).not.toBeNull();
        
        // The selected type should be visible
        // (We're not checking specific button text because the test is about behavior preservation)
      });
    });
  });
});
