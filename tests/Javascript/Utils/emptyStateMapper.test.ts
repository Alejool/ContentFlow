import { describe, it, expect } from 'vitest';
import {
  getEmptyStateConfig,
  getEmptyStateByKey,
  isDataEmpty,
  emptyStateContexts,
} from '@/Utils/emptyStateMapper';
import { emptyStateConfigs } from '@/Constants/emptyStateConfigs';

describe('emptyStateMapper', () => {
  describe('emptyStateContexts', () => {
    it('should define mappings for all required contexts', () => {
      const routes = emptyStateContexts.map((ctx) => ctx.route);
      
      expect(routes).toContain('reels.gallery');
      expect(routes).toContain('content.index');
      expect(routes).toContain('analytics.index');
      expect(routes).toContain('calendar.index');
    });

    it('should map to valid config keys', () => {
      emptyStateContexts.forEach((ctx) => {
        expect(emptyStateConfigs[ctx.configKey]).toBeDefined();
      });
    });
  });

  describe('getEmptyStateConfig', () => {
    it('should return null when route is not mapped', () => {
      const props = { someData: [] };
      const result = getEmptyStateConfig('unknown.route', props);
      
      expect(result).toBeNull();
    });

    it('should return null when data exists (array with items)', () => {
      const props = { reels: [{ id: 1, title: 'Test Reel' }] };
      const result = getEmptyStateConfig('reels.gallery', props);
      
      expect(result).toBeNull();
    });

    it('should return config when data is empty array', () => {
      const props = { reels: [] };
      const result = getEmptyStateConfig('reels.gallery', props);
      
      expect(result).toBeDefined();
      expect(result).toEqual(emptyStateConfigs.reels);
    });

    it('should return config when data is null', () => {
      const props = { reels: null };
      const result = getEmptyStateConfig('reels.gallery', props);
      
      expect(result).toBeDefined();
      expect(result).toEqual(emptyStateConfigs.reels);
    });

    it('should return config when data is undefined', () => {
      const props = {};
      const result = getEmptyStateConfig('reels.gallery', props);
      
      expect(result).toBeDefined();
      expect(result).toEqual(emptyStateConfigs.reels);
    });

    it('should return null when data is non-empty object', () => {
      const props = { analytics: { views: 100, clicks: 50 } };
      const result = getEmptyStateConfig('analytics.index', props);
      
      expect(result).toBeNull();
    });

    it('should return config when data is empty object', () => {
      const props = { analytics: {} };
      const result = getEmptyStateConfig('analytics.index', props);
      
      expect(result).toBeDefined();
      expect(result).toEqual(emptyStateConfigs.analytics);
    });

    it('should handle all defined route contexts correctly', () => {
      emptyStateContexts.forEach((ctx) => {
        const emptyProps = { [ctx.dataKey]: [] };
        const result = getEmptyStateConfig(ctx.route, emptyProps);
        
        expect(result).toBeDefined();
        expect(result).toEqual(emptyStateConfigs[ctx.configKey]);
      });
    });
  });

  describe('getEmptyStateByKey', () => {
    it('should return config for valid key', () => {
      const result = getEmptyStateByKey('reels');
      
      expect(result).toBeDefined();
      expect(result).toEqual(emptyStateConfigs.reels);
    });

    it('should return config for searchResults', () => {
      const result = getEmptyStateByKey('searchResults');
      
      expect(result).toBeDefined();
      expect(result).toEqual(emptyStateConfigs.searchResults);
    });

    it('should return undefined for invalid key', () => {
      const result = getEmptyStateByKey('nonexistent' as any);
      
      expect(result).toBeUndefined();
    });

    it('should work for all config keys', () => {
      const keys = Object.keys(emptyStateConfigs) as Array<
        keyof typeof emptyStateConfigs
      >;
      
      keys.forEach((key) => {
        const result = getEmptyStateByKey(key);
        expect(result).toBeDefined();
        expect(result).toEqual(emptyStateConfigs[key]);
      });
    });
  });

  describe('isDataEmpty', () => {
    it('should return true for null', () => {
      expect(isDataEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isDataEmpty(undefined)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isDataEmpty([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(isDataEmpty([1, 2, 3])).toBe(false);
    });

    it('should return true for empty object', () => {
      expect(isDataEmpty({})).toBe(true);
    });

    it('should return false for non-empty object', () => {
      expect(isDataEmpty({ key: 'value' })).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isDataEmpty('test')).toBe(false);
      expect(isDataEmpty('')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isDataEmpty(0)).toBe(false);
      expect(isDataEmpty(42)).toBe(false);
    });

    it('should return false for booleans', () => {
      expect(isDataEmpty(true)).toBe(false);
      expect(isDataEmpty(false)).toBe(false);
    });
  });
});
