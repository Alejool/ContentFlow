declare module '@inertiajs/react' {
  import { ComponentType, ReactNode } from 'react';

  export interface PageProps {
    [key: string]: any;
  }

  export interface Page<T = PageProps> {
    component: string;
    props: T;
    url: string;
    version: string | null;
  }

  export function usePage<T = PageProps>(): Page<T>;
  export function useForm<T = any>(data?: T): any;
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
  export const Link: ComponentType<any>;

  export default Link;
}
