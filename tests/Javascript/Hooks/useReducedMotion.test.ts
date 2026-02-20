import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReducedMotion } from '@/Hooks/useReducedMotion';

describe('useReducedMotion', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should return prefersReducedMotion as false when media query does not match', () => {
    // Mock matchMedia to return false
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.shouldAnimate).toBe(true);
  });

  it('should return prefersReducedMotion as true when media query matches', () => {
    // Mock matchMedia to return true
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.shouldAnimate).toBe(false);
  });

  it('should return 0 duration when reduced motion is preferred', () => {
    // Mock matchMedia to return true
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.getAnimationDuration(300)).toBe(0);
  });

  it('should return default duration when reduced motion is not preferred', () => {
    // Mock matchMedia to return false
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.getAnimationDuration(300)).toBe(300);
  });

  it('should handle missing matchMedia gracefully', () => {
    // Remove matchMedia
    const originalMatchMedia = window.matchMedia;
    // @ts-ignore
    delete window.matchMedia;

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.shouldAnimate).toBe(true);

    // Restore matchMedia
    window.matchMedia = originalMatchMedia;
  });
});
