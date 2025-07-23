import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
    created_at: string;
    updated_at: string;
}

export interface Campaign {
    id: number;
    title: string;
    status: 'active' | 'inactive' | 'paused';
    created_at: string;
    updated_at: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    campaigns?: Campaign[];
};

declare global {
    interface Window {
        route: typeof route;
    }
}

export {};