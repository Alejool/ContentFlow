declare module '@inertiajs/react' {
  import { ComponentType, ReactNode } from 'react';

  export interface PageProps {
    [key: string]: unknown;
  }

  export interface Page<T = PageProps> {
    component: string;
    props: T;
    url: string;
    version: string | null;
  }

  export function usePage<T = PageProps>(): Page<T>;
  export function useForm<T = Record<string, unknown>>(
    data?: T,
  ): {
    data: T;
    setData: (key: keyof T, value: unknown) => void;
    post: (url: string, options?: Record<string, unknown>) => void;
    put: (url: string, options?: Record<string, unknown>) => void;
    patch: (url: string, options?: Record<string, unknown>) => void;
    delete: (url: string, options?: Record<string, unknown>) => void;
    reset: (...fields: (keyof T)[]) => void;
    errors: Partial<Record<keyof T, string>>;
    processing: boolean;
    wasSuccessful: boolean;
    recentlySuccessful: boolean;
  };
  export const router: {
    visit(url: string, options?: Record<string, unknown>): void;
    get(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    post(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    put(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    patch(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    delete(url: string, options?: Record<string, unknown>): void;
    reload(options?: Record<string, unknown>): void;
  };

  export const Head: ComponentType<{ title?: string; children?: ReactNode }>;
  export const Link: ComponentType<{
    href: string;
    method?: string;
    children?: ReactNode;
    className?: string;
    [key: string]: unknown;
  }>;

  export default Link;
}
