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
  export function router(): any;

  export const Head: ComponentType<{ title?: string; children?: ReactNode }>;
  export const Link: ComponentType<any>;

  export default Link;
}
