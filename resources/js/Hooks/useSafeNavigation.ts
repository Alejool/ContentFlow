import { router } from '@inertiajs/react';
import { useCallback, useRef } from 'react';

/**
 * Hook to safely handle Inertia navigation and prevent "Transition was skipped" errors
 * 
 * This hook prevents multiple simultaneous navigations by tracking the navigation state
 * and ignoring duplicate navigation attempts while one is already in progress.
 * 
 * @example
 * const { safeVisit, isNavigating } = useSafeNavigation();
 * 
 * const handleClick = () => {
 *   safeVisit('/dashboard', { preserveState: true });
 * };
 */
export const useSafeNavigation = () => {
  const isNavigatingRef = useRef(false);

  const safeVisit = useCallback(
    (
      href: string,
      options?: Parameters<typeof router.visit>[1],
    ) => {
      // Prevent duplicate navigation attempts
      if (isNavigatingRef.current) {
        console.warn(
          `[useSafeNavigation] Navigation already in progress, skipping navigation to: ${href}`,
        );
        return;
      }

      isNavigatingRef.current = true;

      router.visit(href, {
        ...options,
        onSuccess: (page) => {
          isNavigatingRef.current = false;
          options?.onSuccess?.(page);
        },
        onError: (errors) => {
          isNavigatingRef.current = false;
          options?.onError?.(errors);
        },
        onCancelled: () => {
          isNavigatingRef.current = false;
          options?.onCancelled?.();
        },
        onFinish: (visit) => {
          isNavigatingRef.current = false;
          options?.onFinish?.(visit);
        },
      });
    },
    [],
  );

  const safePost = useCallback(
    (
      href: string,
      data?: Record<string, any>,
      options?: Parameters<typeof router.post>[2],
    ) => {
      if (isNavigatingRef.current) {
        console.warn(
          `[useSafeNavigation] Navigation already in progress, skipping POST to: ${href}`,
        );
        return;
      }

      isNavigatingRef.current = true;

      router.post(href, data, {
        ...options,
        onSuccess: (page) => {
          isNavigatingRef.current = false;
          options?.onSuccess?.(page);
        },
        onError: (errors) => {
          isNavigatingRef.current = false;
          options?.onError?.(errors);
        },
        onCancelled: () => {
          isNavigatingRef.current = false;
          options?.onCancelled?.();
        },
        onFinish: (visit) => {
          isNavigatingRef.current = false;
          options?.onFinish?.(visit);
        },
      });
    },
    [],
  );

  const safePut = useCallback(
    (
      href: string,
      data?: Record<string, any>,
      options?: Parameters<typeof router.put>[2],
    ) => {
      if (isNavigatingRef.current) {
        console.warn(
          `[useSafeNavigation] Navigation already in progress, skipping PUT to: ${href}`,
        );
        return;
      }

      isNavigatingRef.current = true;

      router.put(href, data, {
        ...options,
        onSuccess: (page) => {
          isNavigatingRef.current = false;
          options?.onSuccess?.(page);
        },
        onError: (errors) => {
          isNavigatingRef.current = false;
          options?.onError?.(errors);
        },
        onCancelled: () => {
          isNavigatingRef.current = false;
          options?.onCancelled?.();
        },
        onFinish: (visit) => {
          isNavigatingRef.current = false;
          options?.onFinish?.(visit);
        },
      });
    },
    [],
  );

  const safeDelete = useCallback(
    (
      href: string,
      options?: Parameters<typeof router.delete>[1],
    ) => {
      if (isNavigatingRef.current) {
        console.warn(
          `[useSafeNavigation] Navigation already in progress, skipping DELETE to: ${href}`,
        );
        return;
      }

      isNavigatingRef.current = true;

      router.delete(href, {
        ...options,
        onSuccess: (page) => {
          isNavigatingRef.current = false;
          options?.onSuccess?.(page);
        },
        onError: (errors) => {
          isNavigatingRef.current = false;
          options?.onError?.(errors);
        },
        onCancelled: () => {
          isNavigatingRef.current = false;
          options?.onCancelled?.();
        },
        onFinish: (visit) => {
          isNavigatingRef.current = false;
          options?.onFinish?.(visit);
        },
      });
    },
    [],
  );

  return {
    safeVisit,
    safePost,
    safePut,
    safeDelete,
    isNavigating: isNavigatingRef.current,
  };
};
