# Command Palette - Paleta de Comandos Mejorada

Sistema de paleta de comandos completamente renovado con **Headless UI v2**, **Framer Motion**, hook personalizado y comandos organizados por categorías.

## 📁 Estructura de Archivos

```
resources/js/Components/CommandPalette/
├── CommandPalette.tsx              # Componente principal con UI
├── commandPaletteCommands.tsx      # Constantes con todos los comandos
└── README.md                       # Esta documentación

resources/js/Hooks/
└── useCommandPalette.ts            # Hook personalizado con lógica
```

## 🎯 Características

### ✨ Mejoras Implementadas

1. **Hook Personalizado (`useCommandPalette`)**
   - Lógica separada del componente UI
   - Gestión de estado (open/close, query)
   - Filtrado inteligente por nombre, descripción y keywords
   - Agrupación automática por categorías
   - Métodos helper: `open()`, `close()`, `toggle()`

2. **Constantes Organizadas (`COMMAND_PALETTE_COMMANDS`)**
   - 20+ comandos funcionales
   - Organizados en 6 categorías:
     - **Navigation**: Dashboard, Contenido, Calendario, Workspaces, Analytics
     - **Actions**: Crear publicación, Crear reel, Logout
     - **Content**: Borradores, Programadas, Publicadas, Fallidas
     - **Accounts**: Cuentas conectadas, Conectar cuenta
     - **Settings**: Perfil, Configuración del espacio
     - **Theme**: Tema claro, oscuro, sistema
   - Cada comando incluye:
     - `id`: Identificador único
     - `name`: Nombre visible
     - `description`: Descripción corta
     - `href` o `action`: Navegación o acción
     - `icon`: Icono de Lucide React
     - `category`: Categoría para agrupación
     - `keywords`: Palabras clave para búsqueda

3. **Headless UI v2**
   - Sin deprecations (usa nuevos componentes)
   - `Dialog`, `DialogPanel`
   - `Combobox`, `ComboboxInput`, `ComboboxOption`, `ComboboxOptions`
   - Totalmente accesible (ARIA)

4. **Framer Motion**
   - Animaciones suaves de entrada/salida
   - Backdrop con fade
   - Panel con scale + slide
   - `AnimatePresence` para unmount animations

5. **Búsqueda Inteligente**
   - Busca en nombre del comando
   - Busca en descripción
   - Busca en keywords
   - Case-insensitive
   - Resultados agrupados por categoría

6. **Integración con ThemeContext**
   - Cambio de tema funcional usando eventos personalizados
   - Toast de confirmación al cambiar tema
   - Soporte para light, dark y system

## 🚀 Uso

### Abrir la Paleta

```typescript
// Atajo de teclado (automático)
Cmd/Ctrl + K

// Desde código
window.dispatchEvent(new Event('open-command-palette'));
```

### Comandos Disponibles

#### Navegación (5)
- **Dashboard**: Panel principal
- **Gestionar Contenido**: Todas las publicaciones
- **Planificador**: Calendario de publicaciones
- **Espacios de Trabajo**: Gestionar workspaces
- **Analíticas**: Estadísticas y métricas

#### Acciones (3)
- **Crear Publicación**: Nueva publicación
- **Crear Reel**: Nuevo video corto
- **Cerrar Sesión**: Logout

#### Contenido (4)
- **Borradores**: Publicaciones en borrador
- **Programadas**: Publicaciones agendadas
- **Publicadas**: Publicaciones enviadas
- **Fallidas**: Publicaciones con errores

#### Cuentas (2)
- **Cuentas Conectadas**: Gestionar redes sociales
- **Conectar Cuenta**: Añadir nueva red social

#### Configuración (2)
- **Mi Perfil**: Editar información personal
- **Configuración del Espacio**: Ajustes del workspace

#### Tema (3)
- **Tema Claro**: Cambiar a modo claro
- **Tema Oscuro**: Cambiar a modo oscuro
- **Tema del Sistema**: Usar preferencia del sistema

## 🔧 Cambios Técnicos

### Rutas Corregidas
Todos los comandos ahora usan las rutas correctas del proyecto:
- `route('dashboard')` - Dashboard
- `route('content.index')` - Contenido
- `route('analytics.index')` - Analytics
- `route('workspaces.index')` - Workspaces
- `route('social-accounts.index')` - Cuentas sociales
- `route('profile.edit')` - Perfil

### Sistema de Temas
El cambio de tema ahora funciona correctamente:

```typescript
// Dispatch evento que ThemeContext escucha
window.dispatchEvent(new CustomEvent('set-theme', { 
    detail: { theme: 'light' | 'dark' | 'system' } 
}));
```

El `ThemeContext` escucha el evento `set-theme` y actualiza el tema correctamente con:
- Transición suave
- Persistencia en localStorage
- Sincronización con backend
- Toast de confirmación

### Hover en Modo Oscuro
Se corrigió el problema del hover en modo oscuro:
- Removido `motion.div` problemático
- Usadas clases de Tailwind directamente
- Transiciones CSS nativas
- Soporte completo para dark mode

## 📋 Agregar Nuevos Comandos

Edita `commandPaletteCommands.tsx`:

```typescript
export const COMMAND_PALETTE_COMMANDS: CommandItem[] = [
    // ... comandos existentes
    {
        id: 'mi-nuevo-comando',
        name: 'Mi Nuevo Comando',
        description: 'Descripción de lo que hace',
        href: route('mi.ruta'),  // O usa 'action' para función
        icon: MiIcono,  // De lucide-react
        category: 'actions',  // O cualquier categoría
        keywords: ['palabra', 'clave', 'busqueda'],
    },
];
```

## 🎨 Personalización

### Cambiar Animaciones

Edita las props de `motion.div` en `CommandPalette.tsx`:

```typescript
<motion.div
    initial={{ opacity: 0, scale: 0.95, y: -20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: -20 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}  // Ajusta aquí
>
```

### Cambiar Estilos

Los estilos usan Tailwind CSS. Edita las clases en `CommandPalette.tsx`:

```typescript
// Backdrop
className="fixed inset-0 bg-gray-500/25 backdrop-blur-sm dark:bg-black/50"

// Panel
className="transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:divide-gray-800 dark:bg-gray-900"

// Items con hover
className="flex cursor-pointer select-none items-center rounded-lg p-3 transition-colors bg-gray-100 dark:bg-gray-800"
```

## 🚦 Atajos de Teclado

- `Cmd/Ctrl + K`: Abrir/Cerrar paleta
- `ESC`: Cerrar paleta
- `↑↓`: Navegar entre opciones
- `Enter`: Seleccionar opción
- Escribir: Filtrar comandos

## 📦 Dependencias

```json
{
    "@headlessui/react": "^2.x",
    "framer-motion": "^11.x",
    "lucide-react": "^0.x",
    "@inertiajs/react": "^1.x"
}
```

## ✅ Problemas Resueltos

### ✓ Comandos que no funcionaban
- Todas las rutas ahora usan `route()` helper de Ziggy
- Rutas verificadas contra `routes/web.php`
- Parámetros de query correctos

### ✓ Tema no cambiaba
- Integración con `ThemeContext` mediante eventos
- Evento `set-theme` escuchado por el contexto
- Toast de confirmación al cambiar

### ✓ Hover en modo oscuro
- Removido `motion.div` con estilos inline problemáticos
- Usadas clases de Tailwind con `dark:` prefix
- Transiciones CSS nativas

### ✓ Secciones eliminadas
- Removida sección "Help" (no funcional)
- Removidos comandos de notificaciones (no implementados)
- Removidos comandos de billing/team (no disponibles)
- Solo comandos funcionales y verificados

## 🐛 Troubleshooting

### La paleta no abre
- Verifica que el componente esté montado en el layout
- Revisa la consola por errores de TypeScript
- Asegúrate de que Framer Motion esté instalado

### Los comandos no navegan
- Verifica que las rutas existan en `routes/web.php`
- Revisa que Ziggy esté configurado correctamente
- Chequea la consola por errores de ruta

### El tema no cambia
- Verifica que `ThemeContext` esté montado
- Revisa que el evento `set-theme` se dispare
- Chequea la consola por errores

### Errores de TypeScript
- Asegúrate de que el tipo `CommandItem` esté exportado
- Verifica que los iconos sean de `lucide-react`
- Revisa que `route()` esté disponible (Ziggy)

---

**Creado con ❤️ usando Headless UI v2 + Framer Motion + React**

## 📁 Estructura de Archivos

```
resources/js/Components/CommandPalette/
├── CommandPalette.tsx              # Componente principal con UI
├── commandPaletteCommands.tsx      # Constantes con todos los comandos
└── README.md                       # Esta documentación

resources/js/Hooks/
└── useCommandPalette.ts            # Hook personalizado con lógica
```

## 🎯 Características

### ✨ Mejoras Implementadas

1. **Hook Personalizado (`useCommandPalette`)**
   - Lógica separada del componente UI
   - Gestión de estado (open/close, query)
   - Filtrado inteligente por nombre, descripción y keywords
   - Agrupación automática por categorías
   - Métodos helper: `open()`, `close()`, `toggle()`

2. **Constantes Organizadas (`COMMAND_PALETTE_COMMANDS`)**
   - 27+ comandos predefinidos
   - Organizados en 7 categorías:
     - **Navigation**: Dashboard, Contenido, Calendario, Workspaces, Analytics
     - **Actions**: Crear publicación, Crear reel, Subir media, Programar, Logout
     - **Content**: Borradores, Programadas, Publicadas, Fallidas
     - **Accounts**: Cuentas conectadas, Conectar cuenta
     - **Settings**: Perfil, Workspace, Equipo, Facturación, Notificaciones
     - **Theme**: Tema claro, oscuro, sistema
     - **Help**: Atajos, Documentación, Soporte
   - Cada comando incluye:
     - `id`: Identificador único
     - `name`: Nombre visible
     - `description`: Descripción corta
     - `href` o `action`: Navegación o acción
     - `icon`: Icono de Lucide React
     - `category`: Categoría para agrupación
     - `keywords`: Palabras clave para búsqueda

3. **Headless UI v2**
   - Sin deprecations (usa nuevos componentes)
   - `Dialog`, `DialogPanel`
   - `Combobox`, `ComboboxInput`, `ComboboxOption`, `ComboboxOptions`
   - Totalmente accesible (ARIA)

4. **Framer Motion**
   - Animaciones suaves de entrada/salida
   - Backdrop con fade
   - Panel con scale + slide
   - Hover states animados
   - `AnimatePresence` para unmount animations

5. **Búsqueda Inteligente**
   - Busca en nombre del comando
   - Busca en descripción
   - Busca en keywords
   - Case-insensitive
   - Resultados agrupados por categoría

## 🚀 Uso

### Abrir la Paleta

```typescript
// Atajo de teclado (automático)
Cmd/Ctrl + K

// Desde código
window.dispatchEvent(new Event('open-command-palette'));
```

### Agregar Nuevos Comandos

Edita `commandPaletteCommands.tsx`:

```typescript
export const COMMAND_PALETTE_COMMANDS: CommandItem[] = [
    // ... comandos existentes
    {
        id: 'mi-nuevo-comando',
        name: 'Mi Nuevo Comando',
        description: 'Descripción de lo que hace',
        href: '/mi-ruta',  // O usa 'action' para función
        icon: MiIcono,  // De lucide-react
        category: 'actions',  // O cualquier categoría
        keywords: ['palabra', 'clave', 'busqueda'],
    },
];
```

### Agregar Nueva Categoría

1. Agrega la categoría al tipo en `useCommandPalette.ts`:

```typescript
category: 'navigation' | 'actions' | 'content' | 'settings' | 'accounts' | 'theme' | 'help' | 'mi-categoria';
```

2. Agrega el label en `commandPaletteCommands.tsx`:

```typescript
export const CATEGORY_LABELS: Record<string, string> = {
    // ... labels existentes
    'mi-categoria': 'Mi Categoría',
};
```

### Usar el Hook en Otro Componente

```typescript
import { useCommandPalette } from '@/Hooks/useCommandPalette';
import { COMMAND_PALETTE_COMMANDS } from '@/Components/CommandPalette/commandPaletteCommands';

function MiComponente() {
    const { isOpen, open, close, filteredCommands } = useCommandPalette(COMMAND_PALETTE_COMMANDS);
    
    return (
        <button onClick={open}>
            Abrir Paleta
        </button>
    );
}
```

## 🎨 Personalización

### Cambiar Animaciones

Edita las props de `motion.div` en `CommandPalette.tsx`:

```typescript
<motion.div
    initial={{ opacity: 0, scale: 0.95, y: -20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: -20 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}  // Ajusta aquí
>
```

### Cambiar Estilos

Los estilos usan Tailwind CSS. Edita las clases en `CommandPalette.tsx`:

```typescript
// Backdrop
className="fixed inset-0 bg-gray-500/25 backdrop-blur-sm dark:bg-black/50"

// Panel
className="transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:divide-gray-800 dark:bg-gray-900"

// Items
className="flex cursor-pointer select-none items-center rounded-lg p-3"
```

### Cambiar Altura Máxima de Resultados

```typescript
<ComboboxOptions
    static
    className="max-h-[28rem] scroll-py-2 overflow-y-auto p-2"  // Ajusta max-h-[28rem]
>
```

## 🔧 API del Hook

### `useCommandPalette(commands: CommandItem[])`

#### Parámetros
- `commands`: Array de comandos a mostrar

#### Retorna
```typescript
{
    isOpen: boolean;                          // Estado de apertura
    query: string;                            // Texto de búsqueda
    setQuery: (query: string) => void;        // Actualizar búsqueda
    filteredCommands: CommandItem[];          // Comandos filtrados
    groupedCommands: Record<string, CommandItem[]>;  // Comandos agrupados
    handleSelect: (item: CommandItem) => void;  // Ejecutar comando
    open: () => void;                         // Abrir paleta
    close: () => void;                        // Cerrar paleta
    toggle: () => void;                       // Toggle paleta
    setIsOpen: (open: boolean) => void;       // Setter directo
}
```

## 📋 Comandos Disponibles

### Navegación (5)
- Dashboard
- Gestionar Contenido
- Planificador
- Espacios de Trabajo
- Analíticas

### Acciones (5)
- Crear Publicación
- Crear Reel
- Subir Multimedia
- Programar Publicación
- Cerrar Sesión

### Contenido (4)
- Borradores
- Programadas
- Publicadas
- Fallidas

### Cuentas (2)
- Cuentas Conectadas
- Conectar Cuenta

### Configuración (5)
- Mi Perfil
- Configuración del Espacio
- Equipo
- Facturación
- Notificaciones

### Tema (3)
- Tema Claro
- Tema Oscuro
- Tema del Sistema

### Ayuda (3)
- Atajos de Teclado
- Documentación
- Soporte

## 🎯 Eventos Personalizados

El sistema escucha y dispara eventos personalizados:

### Escucha
```typescript
// Abrir paleta
window.addEventListener('open-command-palette', handler);
```

### Dispara (desde comandos)
```typescript
// Abrir modal de atajos
window.dispatchEvent(new CustomEvent('open-shortcuts-modal'));

// Abrir subida de media
window.dispatchEvent(new CustomEvent('open-media-upload'));

// Abrir conectar cuenta
window.dispatchEvent(new CustomEvent('open-connect-account'));

// Cambio de tema
window.dispatchEvent(new CustomEvent('theme-changed', { 
    detail: { theme: 'dark' } 
}));
```

## 🔍 Búsqueda

La búsqueda es inteligente y busca en múltiples campos:

```typescript
// Ejemplo: buscar "crear"
// Encuentra:
// - "Crear Publicación" (nombre)
// - "Crear Reel" (nombre)
// - "Subir Multimedia" (keywords: ['crear'])

// Ejemplo: buscar "dark"
// Encuentra:
// - "Tema Oscuro" (keywords: ['dark'])
```

## 🎨 Temas

El sistema soporta 3 modos de tema:

```typescript
// Cambiar tema programáticamente
const setTheme = (theme: 'light' | 'dark' | 'system') => {
    localStorage.setItem('theme', theme);
    // ... lógica de aplicación
};
```

Los comandos de tema están incluidos en la paleta.

## 🚦 Atajos de Teclado

- `Cmd/Ctrl + K`: Abrir/Cerrar paleta
- `ESC`: Cerrar paleta
- `↑↓`: Navegar entre opciones
- `Enter`: Seleccionar opción
- Escribir: Filtrar comandos

## 📦 Dependencias

```json
{
    "@headlessui/react": "^2.x",
    "framer-motion": "^11.x",
    "lucide-react": "^0.x",
    "@inertiajs/react": "^1.x"
}
```

## 🔄 Migración desde Versión Anterior

### Cambios Principales

1. **Headless UI v1 → v2**
   - `Transition.Root` → `AnimatePresence` (Framer Motion)
   - `Transition.Child` → `motion.div`
   - `Dialog.Panel` → `DialogPanel`
   - `Combobox.Input` → `ComboboxInput`
   - `Combobox.Options` → `ComboboxOptions`
   - `Combobox.Option` → `ComboboxOption`

2. **Comandos Inline → Constantes**
   - Antes: Arrays definidos en el componente
   - Ahora: `COMMAND_PALETTE_COMMANDS` en archivo separado

3. **Lógica en Componente → Hook**
   - Antes: `useState`, `useEffect` en componente
   - Ahora: `useCommandPalette` hook

4. **Sin Categorías → Con Categorías**
   - Antes: Lista plana
   - Ahora: Agrupado por categorías con labels

## 🐛 Troubleshooting

### La paleta no abre
- Verifica que el componente esté montado en el layout
- Revisa la consola por errores de TypeScript
- Asegúrate de que Framer Motion esté instalado

### Los comandos no aparecen
- Verifica que `COMMAND_PALETTE_COMMANDS` esté importado
- Revisa que los comandos tengan la estructura correcta
- Chequea que las categorías existan en `CATEGORY_LABELS`

### Las animaciones no funcionan
- Instala Framer Motion: `npm install framer-motion`
- Verifica que `AnimatePresence` envuelva el contenido condicional

### Errores de TypeScript
- Asegúrate de que el tipo `CommandItem` esté exportado
- Verifica que los iconos sean de `lucide-react`
- Revisa que `route()` esté disponible (Ziggy)

## 📝 Notas

- Los comandos con `href` usan `router.visit()` de Inertia
- Los comandos con `action` ejecutan la función directamente
- El tema se guarda en `localStorage`
- Las animaciones respetan `prefers-reduced-motion`
- El componente es totalmente accesible (ARIA)

## 🎉 Próximas Mejoras

- [ ] Historial de comandos recientes
- [ ] Comandos favoritos
- [ ] Búsqueda fuzzy (Fuse.js)
- [ ] Comandos dinámicos desde backend
- [ ] Shortcuts personalizables
- [ ] Modo compacto/expandido
- [ ] Preview de comandos
- [ ] Comandos anidados (subcomandos)

---

**Creado con ❤️ usando Headless UI v2 + Framer Motion + React**
