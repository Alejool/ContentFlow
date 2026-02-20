import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { OptimisticOperation } from '@/types/optimistic';

// Mock Inertia router - must be before imports
vi.mock('@inertiajs/react', () => ({
  router: {
    reload: vi.fn(),
  },
}));

import {
  isInertiaPage,
  getInertiaPageComponent,
  getInertiaPageProps,
  getPropsToReload,
  syncWithInertia,
  isSharedData,
  mergeOptimisticData,
} from '@/utils/inertiaOptimisticSync';
import { router } from '@inertiajs/react';

describe('inertiaOptimisticSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup DOM for Inertia detection
    document.body.innerHTML = '<div id="app"></div>';
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });
  
  describe('isInertiaPage', () => {
    it('should return false when no Inertia context exists', () => {
      expect(isInertiaPage()).toBe(false);
    });
    
    it('should return true when app element has data-page attribute', () => {
      const appElement = document.getElementById('app');
      appElement?.setAttribute('data-page', JSON.stringify({
        component: 'TestPage',
        props: {},
      }));
      
      expect(isInertiaPage()).toBe(true);
    });
    
    it('should return true when window.Inertia exists', () => {
      (window as any).Inertia = {};
      
      expect(isInertiaPage()).toBe(true);
      
      delete (window as any).Inertia;
    });
  });
  
  describe('getInertiaPageComponent', () => {
    it('should return null when not in Inertia context', () => {
      expect(getInertiaPageComponent()).toBe(null);
    });
    
    it('should return component name from data-page attribute', () => {
      const appElement = document.getElementById('app');
      appElement?.setAttribute('data-page', JSON.stringify({
        component: 'ManageContent/Partials/ContentPage',
        props: {},
      }));
      
      expect(getInertiaPageComponent()).toBe('ManageContent/Partials/ContentPage');
    });
    
    it('should handle malformed data-page gracefully', () => {
      const appElement = document.getElementById('app');
      appElement?.setAttribute('data-page', 'invalid json');
      
      expect(getInertiaPageComponent()).toBe(null);
    });
  });
  
  describe('getInertiaPageProps', () => {
    it('should return null when not in Inertia context', () => {
      expect(getInertiaPageProps()).toBe(null);
    });
    
    it('should return props from data-page attribute', () => {
      const props = {
        auth: { user: { id: 1, name: 'Test' } },
        publications: [],
      };
      
      const appElement = document.getElementById('app');
      appElement?.setAttribute('data-page', JSON.stringify({
        component: 'TestPage',
        props,
      }));
      
      expect(getInertiaPageProps()).toEqual(props);
    });
  });
  
  describe('getPropsToReload', () => {
    it('should return correct props for publications resource', () => {
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'publications',
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const props = getPropsToReload(operation);
      expect(props).toEqual(['publications', 'publication']);
    });
    
    it('should return correct props for campaigns resource', () => {
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'update',
        resource: 'campaigns',
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const props = getPropsToReload(operation);
      expect(props).toEqual(['campaigns', 'campaign']);
    });
    
    it('should include collection key for delete operations', () => {
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'delete',
        resource: 'publications',
        resourceId: 123,
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const props = getPropsToReload(operation);
      expect(props).toContain('publications');
    });
    
    it('should return empty array for unknown resource', () => {
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'unknown-resource',
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const props = getPropsToReload(operation);
      expect(props).toEqual([]);
    });
  });
  
  describe('syncWithInertia', () => {
    beforeEach(() => {
      // Setup Inertia context
      const appElement = document.getElementById('app');
      appElement?.setAttribute('data-page', JSON.stringify({
        component: 'TestPage',
        props: {},
      }));
    });
    
    it('should not reload for pending operations', () => {
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'publications',
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      syncWithInertia(operation, 'pending');
      
      expect(router.reload).not.toHaveBeenCalled();
    });
    
    it('should reload relevant props on success', () => {
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'publications',
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'success',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      syncWithInertia(operation, 'success', { id: 123 });
      
      expect(router.reload).toHaveBeenCalledWith({
        only: ['publications', 'publication'],
        preserveScroll: true,
        preserveState: true,
      });
    });
    
    it('should reload props on failure for create/update operations', () => {
      vi.useFakeTimers();
      
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'publications',
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'failed',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      syncWithInertia(operation, 'failed');
      
      // Should not be called immediately
      expect(router.reload).not.toHaveBeenCalled();
      
      // Should be called after delay
      vi.advanceTimersByTime(500);
      expect(router.reload).toHaveBeenCalledWith({
        only: ['publications', 'publication'],
        preserveScroll: true,
        preserveState: true,
      });
      
      vi.useRealTimers();
    });
    
    it('should not reload when not in Inertia context', () => {
      // Remove Inertia context
      document.body.innerHTML = '';
      
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'publications',
        optimisticData: {},
        originalData: null,
        request: Promise.resolve({}),
        status: 'success',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      syncWithInertia(operation, 'success');
      
      expect(router.reload).not.toHaveBeenCalled();
    });
  });
  
  describe('isSharedData', () => {
    it('should return true for auth prop', () => {
      expect(isSharedData('auth')).toBe(true);
    });
    
    it('should return true for flash prop', () => {
      expect(isSharedData('flash')).toBe(true);
    });
    
    it('should return true for errors prop', () => {
      expect(isSharedData('errors')).toBe(true);
    });
    
    it('should return false for resource props', () => {
      expect(isSharedData('publications')).toBe(false);
      expect(isSharedData('campaigns')).toBe(false);
      expect(isSharedData('reels')).toBe(false);
    });
  });
  
  describe('mergeOptimisticData', () => {
    it('should add optimistic item for create operation', () => {
      const props = {
        publications: [
          { id: 1, title: 'Existing' },
        ],
      };
      
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'publications',
        optimisticData: { id: 'temp-1', title: 'New' },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const merged = mergeOptimisticData(props, operation);
      
      expect(merged.publications).toHaveLength(2);
      expect(merged.publications[0]).toEqual({ id: 'temp-1', title: 'New' });
    });
    
    it('should update item for update operation', () => {
      const props = {
        publications: [
          { id: 1, title: 'Original' },
          { id: 2, title: 'Other' },
        ],
      };
      
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'update',
        resource: 'publications',
        resourceId: 1,
        optimisticData: { title: 'Updated' },
        originalData: { id: 1, title: 'Original' },
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const merged = mergeOptimisticData(props, operation);
      
      expect(merged.publications[0].title).toBe('Updated');
      expect(merged.publications[1].title).toBe('Other');
    });
    
    it('should remove item for delete operation', () => {
      const props = {
        publications: [
          { id: 1, title: 'To Delete' },
          { id: 2, title: 'Keep' },
        ],
      };
      
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'delete',
        resource: 'publications',
        resourceId: 1,
        optimisticData: {},
        originalData: { id: 1, title: 'To Delete' },
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const merged = mergeOptimisticData(props, operation);
      
      expect(merged.publications).toHaveLength(1);
      expect(merged.publications[0].id).toBe(2);
    });
    
    it('should not modify shared data', () => {
      const props = {
        auth: { user: { id: 1 } },
        publications: [],
      };
      
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'auth',
        optimisticData: { user: { id: 2 } },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const merged = mergeOptimisticData(props, operation);
      
      // Auth should not be modified
      expect(merged.auth).toEqual({ user: { id: 1 } });
    });
    
    it('should not modify props when resource does not exist', () => {
      const props = {
        publications: [],
      };
      
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'campaigns',
        optimisticData: { id: 1 },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };
      
      const merged = mergeOptimisticData(props, operation);
      
      expect(merged).toEqual(props);
    });
  });
});
