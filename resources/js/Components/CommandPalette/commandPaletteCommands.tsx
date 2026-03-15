import type { CommandItem } from '@/Hooks/useCommandPalette';
import { router } from '@inertiajs/react';
import {
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Palette,
  Plus,
  Settings,
  Sun,
  Target,
  TrendingUp,
  User,
  Video
} from 'lucide-react';

export const COMMAND_PALETTE_COMMANDS: CommandItem[] = [
    // ==================== NAVIGATION ====================
    {
        id: 'nav-dashboard',
        name: 'Dashboard',
        description: 'Ver panel principal',
        href: route('dashboard'),
        icon: LayoutDashboard,
        category: 'navigation',
        keywords: ['inicio', 'home', 'principal'],
    },
    {
        id: 'nav-content',
        name: 'Gestionar Contenido',
        description: 'Ver todas las publicaciones',
        href: route('content.index'),
        icon: FileText,
        category: 'navigation',
        keywords: ['publicaciones', 'posts', 'contenido'],
    },
    {
        id: 'nav-calendar',
        name: 'Calendario',
        description: 'Ver calendario de publicaciones',
        href: route('content.index', { tab: 'calendar' }),
        icon: Calendar,
        category: 'navigation',
        keywords: ['calendario', 'schedule', 'planificar'],
    },
    {
        id: 'nav-campaigns',
        name: 'Campañas',
        description: 'Gestionar campañas',
        href: route('content.index', { tab: 'campaigns' }),
        icon: Target,
        category: 'navigation',
        keywords: ['campañas', 'campaigns', 'grupos'],
    },
    {
        id: 'nav-workspaces',
        name: 'Espacios de Trabajo',
        description: 'Gestionar espacios de trabajo',
        href: route('workspaces.index'),
        icon: Target,
        category: 'navigation',
        keywords: ['workspaces', 'equipos', 'proyectos'],
    },
    {
        id: 'nav-analytics',
        name: 'Analíticas',
        description: 'Ver estadísticas y métricas',
        href: route('analytics.index'),
        icon: TrendingUp,
        category: 'navigation',
        keywords: ['estadísticas', 'métricas', 'stats', 'analytics'],
    },

    // ==================== ACTIONS ====================
    {
        id: 'action-create-post',
        name: 'Crear Publicación',
        description: 'Nueva publicación en redes sociales',
        action: () => router.visit(route('content.index', { action: 'create' })),
        icon: Plus,
        category: 'actions',
        keywords: ['nuevo', 'crear', 'post', 'publicar'],
    },
    {
        id: 'action-create-reel',
        name: 'Crear Reel',
        description: 'Nuevo video corto',
        action: () => router.visit(route('content.index', { action: 'create', type: 'reel' })),
        icon: Video,
        category: 'actions',
        keywords: ['video', 'reel', 'shorts', 'tiktok'],
    },
    {
        id: 'action-logout',
        name: 'Cerrar Sesión',
        description: 'Salir de la cuenta',
        action: () => router.post(route('logout')),
        icon: LogOut,
        category: 'actions',
        keywords: ['cerrar', 'logout', 'salir', 'exit'],
    },
 
    // ==================== SETTINGS ====================
    {
        id: 'settings-profile',
        name: 'Mi Perfil',
        description: 'Editar información personal',
        href: route('profile.edit'),
        icon: User,
        category: 'settings',
        keywords: ['perfil', 'profile', 'cuenta', 'usuario'],
    },
    {
        id: 'settings-workspace',
        name: 'Configuración del Espacio',
        description: 'Ajustes del espacio de trabajo',
        href: route('workspaces.index'),
        icon: Settings,
        category: 'settings',
        keywords: ['configuración', 'settings', 'ajustes', 'workspace'],
    },

    // ==================== BILLING ====================
    {
        id: 'billing-pricing',
        name: 'Ver Planes',
        description: 'Explorar planes y precios',
        href: route('pricing'),
        icon: TrendingUp,
        category: 'billing',
        keywords: ['planes', 'pricing', 'precios', 'suscripción', 'upgrade'],
    },
    {
        id: 'billing-addons',
        name: 'Comprar Créditos',
        description: 'Adquirir créditos adicionales',
        href: route('subscription.addons'),
        icon: Plus,
        category: 'billing',
        keywords: ['créditos', 'addons', 'comprar', 'ai', 'storage', 'almacenamiento'],
    },

    // ==================== THEME ====================
    {
        id: 'theme-light',
        name: 'Tema Claro',
        description: 'Cambiar a modo claro',
        action: () => {
            window.dispatchEvent(new CustomEvent('set-theme', { detail: { theme: 'light' } }));
        },
        icon: Sun,
        category: 'theme',
        keywords: ['tema', 'theme', 'claro', 'light'],
    },
    {
        id: 'theme-dark',
        name: 'Tema Oscuro',
        description: 'Cambiar a modo oscuro',
        action: () => {
            window.dispatchEvent(new CustomEvent('set-theme', { detail: { theme: 'dark' } }));
        },
        icon: Moon,
        category: 'theme',
        keywords: ['tema', 'theme', 'oscuro', 'dark'],
    },
    {
        id: 'theme-system',
        name: 'Tema del Sistema',
        description: 'Usar preferencia del sistema',
        action: () => {
            window.dispatchEvent(new CustomEvent('set-theme', { detail: { theme: 'system' } }));
        },
        icon: Palette,
        category: 'theme',
        keywords: ['tema', 'theme', 'sistema', 'system', 'auto'],
    },
];

// Category labels for display
export const CATEGORY_LABELS: Record<string, string> = {
    navigation: 'Navegación',
    actions: 'Acciones',
    accounts: 'Cuentas',
    settings: 'Configuración',
    billing: 'Facturación',
    theme: 'Tema',
};
