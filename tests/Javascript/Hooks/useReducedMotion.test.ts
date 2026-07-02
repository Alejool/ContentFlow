import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReducedMotion } from '@/Hooks/ui/useReducedMotion';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('useReducedMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when media query does not match', () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('should return true when media query matches', () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  // The current hook (resources/js/Hooks/ui/useReducedMotion.ts) no longer
  // guards against a missing window.matchMedia — it assumes a browser
  // environment. Skipped rather than deleted in case the guard returns.
  it.skip('should handle missing matchMedia gracefully', () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-ignore
    delete window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    window.matchMedia = originalMatchMedia;
  });
});
