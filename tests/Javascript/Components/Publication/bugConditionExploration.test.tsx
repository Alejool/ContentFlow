/**
 * Bug Condition Exploration Test
 * Publication Type and Platform Compatibility
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test encodes the EXPECTED behavior (after fix). When run on unfixed code,
 * it will fail, demonstrating that incompatible combinations are currently allowed.
 * 
 * After implementing the fix, this same test should PASS, confirming the bug is resolved.
 */

import ContentTypeIconSelector from '@/Components/Content/Publication/common/ContentTypeIconSelector';
import ContentTypeSelector from '@/Components/Content/Publication/common/ContentTypeSelector';
import SocialAccountsSection from '@/Components/Content/Publication/common/add/SocialAccountsSection';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Mock translation function
const mockT = (key: string) => key;

// Platform compatibility rules (from CONTENT_TYPE_RULES)
const PLATFORM_RULES = {
  post: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest'],
  reel: ['instagram', 'tiktok', 'youtube', 'facebook'],
  story: ['instagram', 'facebook'],
  poll: ['twitter'], // Facebook no soporta encuestas nativas
  carousel: ['instagram', 'facebook', 'linkedin'],
};

/**
 * Bug Condition Function (from design.md)
 * Returns true if the combination is incompatible (bug condition exists)
 */
function isBugCondition(input: { selectedType: string; selectedPlatforms: string[] }): boolean {
  const compatiblePlatforms = PLATFORM_RULES[input.selectedType as keyof typeof PLATFORM_RULES];
  
  return input.selectedPlatforms.length > 0 
         && input.selectedPlatforms.some(platform => 
           !compatiblePlatforms.includes(platform.toLowerCase())
         );
}

describe('Bug Condition Exploration: Incompatible Content Type and Platform Combinations', () => {
  describe('Property 1: Platform-First Selection - Type Filtering', () => {
    it('should NOT show Story type when YouTube is selected (YouTube does not support Story)', () => {
      // EXPECTED BEHAVIOR: Story should be filtered out when YouTube is selected
      // BUG: Currently uses some() instead of every(), so Story remains visible
      
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
      
      // Story should NOT be visible because YouTube doesn't support it
      const storyButton = screen.queryByText('Story');
      
      // EXPECTED: Story button should not exist or be disabled
      // ACTUAL (unfixed): Story button exists and is enabled
      expect(storyButton).toBeNull();
    });

    it('should NOT show Reel type when Twitter is selected (Twitter does not support Reel)', () => {
      // EXPECTED BEHAVIOR: Reel should be filtered out when Twitter is selected
      // BUG: Currently uses some() instead of every(), so Reel remains visible
      
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
      
      // Reel should NOT be visible because Twitter doesn't support it
      const reelButton = screen.queryByText(/Reel/);
      
      // EXPECTED: Reel button should not exist
      // ACTUAL (unfixed): Reel button exists and is enabled
      expect(reelButton).toBeNull();
    });

    it('should show only Post and Reel when Instagram, Twitter, and YouTube are selected (intersection)', () => {
      // EXPECTED BEHAVIOR: Only types supported by ALL platforms should be shown
      // Post: supported by all three ✓
      // Reel: supported by Instagram and YouTube, but NOT Twitter ✗
      // Story: supported by Instagram, but NOT Twitter or YouTube ✗
      // Poll: supported by Twitter, but NOT Instagram or YouTube ✗
      // Carousel: supported by Instagram, but NOT Twitter or YouTube ✗
      
      // Actually, only POST is supported by all three!
      // Reel is NOT supported by Twitter
      
      const selectedPlatforms = ['instagram', 'twitter', 'youtube'];
      const onChange = () => {};
      
      const { container } = render(
        <ContentTypeSelector
          selectedType="post"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
        />
      );
      
      // Only Post should be visible (supported by all three platforms)
      const postButton = screen.queryByText('Post');
      expect(postButton).not.toBeNull();
      
      // Reel should NOT be visible (Twitter doesn't support it)
      const reelButton = screen.queryByText(/Reel/);
      expect(reelButton).toBeNull();
      
      // Story should NOT be visible (Twitter and YouTube don't support it)
      const storyButton = screen.queryByText('Story');
      expect(storyButton).toBeNull();
      
      // Poll should NOT be visible (Instagram and YouTube don't support it)
      const pollButton = screen.queryByText('Poll');
      expect(pollButton).toBeNull();
      
      // Carousel should NOT be visible (Twitter and YouTube don't support it)
      const carouselButton = screen.queryByText('Carousel');
      expect(carouselButton).toBeNull();
    });
  });

  describe('Property 1: Type-First Selection - Platform Filtering', () => {
    it('should disable Instagram when Poll type is selected (Instagram does not support Poll)', () => {
      // EXPECTED BEHAVIOR: Instagram checkbox should be disabled when Poll is selected
      // BUG: Currently no platform filtering exists in SocialAccountsSection
      
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
          contentType="poll"
        />
      );
      
      // Instagram should be disabled (Poll only supports Twitter)
      const instagramCheckbox = container.querySelector('[data-platform="instagram"]');
      
      // EXPECTED: Instagram checkbox should be disabled or have disabled styling
      // ACTUAL (unfixed): Instagram checkbox is enabled and selectable
      // Note: This will fail because contentType prop doesn't exist yet
      expect(instagramCheckbox).toHaveAttribute('disabled');
    });

    it('should disable YouTube when Story type is selected (YouTube does not support Story)', () => {
      // EXPECTED BEHAVIOR: YouTube checkbox should be disabled when Story is selected
      // BUG: Currently no platform filtering exists in SocialAccountsSection
      
      const mockAccounts = [
        { id: 1, platform: 'instagram', name: 'test_instagram', account_name: 'test_instagram' },
        { id: 2, platform: 'youtube', name: 'test_youtube', account_name: 'test_youtube' },
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
          contentType="story"
        />
      );
      
      // YouTube should be disabled (Story only supports Instagram and Facebook)
      const youtubeCheckbox = container.querySelector('[data-platform="youtube"]');
      
      // EXPECTED: YouTube checkbox should be disabled
      // ACTUAL (unfixed): YouTube checkbox is enabled and selectable
      expect(youtubeCheckbox).toHaveAttribute('disabled');
    });
  });

  describe('Property 1: Type Lock After Media Upload', () => {
    it('should disable type selector when media files are uploaded', () => {
      // EXPECTED BEHAVIOR: Type selector should be disabled when mediaFiles.length > 0
      // BUG: Currently no type locking based on media upload
      
      const selectedPlatforms = ['instagram'];
      const onChange = () => {};
      const mediaFiles = [{ id: 1, type: 'image', url: 'test.jpg' }];
      
      const { container } = render(
        <ContentTypeIconSelector
          selectedType="post"
          selectedPlatforms={selectedPlatforms}
          onChange={onChange}
          t={mockT}
          disabled={false}
          mediaFiles={mediaFiles}
        />
      );
      
      // All type buttons should be disabled when media is uploaded
      const buttons = container.querySelectorAll('button');
      
      // EXPECTED: All buttons should be disabled
      // ACTUAL (unfixed): Buttons are enabled, type can be changed after upload
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Bug Condition Function Validation', () => {
    it('should identify YouTube + Story as a bug condition', () => {
      const input = {
        selectedType: 'story',
        selectedPlatforms: ['youtube']
      };
      
      // This combination is incompatible (YouTube doesn't support Story)
      expect(isBugCondition(input)).toBe(true);
    });

    it('should identify Twitter + Reel as a bug condition', () => {
      const input = {
        selectedType: 'reel',
        selectedPlatforms: ['twitter']
      };
      
      // This combination is incompatible (Twitter doesn't support Reel)
      expect(isBugCondition(input)).toBe(true);
    });

    it('should identify Poll + Instagram as a bug condition', () => {
      const input = {
        selectedType: 'poll',
        selectedPlatforms: ['instagram']
      };
      
      // This combination is incompatible (Poll only supports Twitter)
      expect(isBugCondition(input)).toBe(true);
    });

    it('should NOT identify Post + any platform as a bug condition', () => {
      const input = {
        selectedType: 'post',
        selectedPlatforms: ['instagram', 'twitter', 'youtube', 'facebook']
      };
      
      // Post is supported by all platforms
      expect(isBugCondition(input)).toBe(false);
    });

    it('should NOT identify compatible combinations as bug conditions', () => {
      const compatibleCombinations = [
        { selectedType: 'story', selectedPlatforms: ['instagram'] },
        { selectedType: 'story', selectedPlatforms: ['facebook'] },
        { selectedType: 'reel', selectedPlatforms: ['instagram', 'youtube'] },
        { selectedType: 'poll', selectedPlatforms: ['twitter'] },
        { selectedType: 'carousel', selectedPlatforms: ['instagram', 'linkedin'] },
      ];
      
      compatibleCombinations.forEach(combo => {
        expect(isBugCondition(combo)).toBe(false);
      });
    });
  });
});
