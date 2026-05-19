import type { CommandItem } from '@/Hooks/CommandPalette/useCommandPalette';
import { NAV_SECTIONS } from '@/Constants/navigation';
import { router } from '@inertiajs/react';
import {
  LogOut,
  Plus,
  Settings,
  User,
  Video,
} from 'lucide-react';

function buildNavigationCommands(): CommandItem[] {
  const commands: CommandItem[] = [];

  for (const section of NAV_SECTIONS) {
    for (const routeDef of section.routes) {
      try {
        commands.push({
          id: `nav-${routeDef.routeName.replace(/\./g, '-')}-${routeDef.nameKey.replace(/\./g, '-')}${routeDef.url ? '-custom' : ''}`,
          name: routeDef.nameKey,
          nameKey: routeDef.nameKey,
          href: routeDef.url || route(routeDef.routeName),
          icon: routeDef.icon,
          category: 'navigation',
          keywords: [routeDef.routeName, section.labelKey, section.id],
          adminOnly: section.id === 'admin',
        });
      } catch {
        // route() might fail for admin routes if user is not admin
      }
    }
  }

  return commands;
}

export const NAVIGATION_COMMANDS = buildNavigationCommands();

export const COMMAND_PALETTE_COMMANDS: CommandItem[] = [
  ...NAVIGATION_COMMANDS,

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
];

export const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navegación',
  actions: 'Acciones',
  settings: 'Configuración',
};