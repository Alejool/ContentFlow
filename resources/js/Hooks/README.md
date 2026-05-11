# Custom Hooks - ContentFlow

Este directorio contiene hooks personalizados reutilizables para la aplicación ContentFlow.

## 🔒 Hooks de Navegación

### `useSafeNavigation`

Hook para manejar navegaciones de Inertia.js de forma segura, previniendo el error "Transition was skipped".

**Ubicación:** `resources/js/Hooks/useSafeNavigation.ts`

**Problema que resuelve:**
- Previene navegaciones duplicadas simultáneas
- Evita errores de "AbortError: Transition was skipped"
- Proporciona estado de navegación para UI

**API:**

```typescript
const {
  safeVisit,    // Navegación GET
  safePost,     // Navegación POST
  safePut,      // Navegación PUT
  safeDelete,   // Navegación DELETE
  isNavigating  // Estado booleano
} = useSafeNavigation();
```

**Ejemplo básico:**

```typescript
import { useSafeNavigation } from '@/Hooks/useSafeNavigation';

function MyComponent() {
  const { safeVisit, isNavigating } = useSafeNavigation();

  return (
    <button 
      onClick={() => safeVisit('/dashboard')}
      disabled={isNavigating}
    >
      {isNavigating ? 'Navegando...' : 'Ir al Dashboard'}
    </button>
  );
}
```

**Ejemplo con POST:**

```typescript
const { safePost, isNavigating } = useSafeNavigation();

const handleSubmit = (data) => {
  safePost('/api/items', data, {
    preserveScroll: true,
    onSuccess: () => toast.success('Guardado'),
    onError: (errors) => console.error(errors),
  });
};
```

**Ver más ejemplos:** `resources/js/Components/examples/SafeNavigationExample.tsx`

---

## 📋 Otros Hooks Disponibles

### `useCommandPalette`

Maneja el estado y lógica del command palette (Cmd+K).

**Características:**
- Filtrado de comandos por query
- Agrupación por categorías
- Navegación segura integrada
- Soporte para acciones personalizadas

**Ejemplo:**

```typescript
import { useCommandPalette } from '@/Hooks/useCommandPalette';

const commands = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    category: 'navigation',
  },
  // ...más comandos
];

const { isOpen, handleSelect, filteredCommands } = useCommandPalette(commands);
```

### `useOptimistic`

Implementa UI optimista para operaciones asíncronas.

**Características:**
- Actualización inmediata de UI
- Rollback automático en caso de error
- Sincronización con servidor

**Ejemplo:**

```typescript
import { useOptimistic } from '@/Hooks/useOptimistic';

const { execute, isLoading } = useOptimistic({
  onOptimistic: (data) => updateLocalState(data),
  onConfirm: async (data) => api.save(data),
  onRollback: (data) => revertLocalState(data),
});
```

### `usePricing`

Maneja la lógica de planes y suscripciones.

**Características:**
- Selección de planes
- Validación de límites
- Integración con pasarelas de pago
- Navegación a checkout

**Ejemplo:**

```typescript
import { usePricing } from '@/Hooks/usePricing';

const { handleSelectPlan, isLoading } = usePricing();

<button onClick={() => handleSelectPlan('pro')}>
  Seleccionar Plan Pro
</button>
```

### `useCompletionNotifications`

Maneja notificaciones de completitud de tareas.

**Características:**
- Notificaciones en tiempo real
- Navegación a contenido relacionado
- Integración con WebSockets

**Ejemplo:**

```typescript
import { useCompletionNotifications } from '@/Hooks/useCompletionNotifications';

const { notifications, markAsRead } = useCompletionNotifications();
```

---

## 🎯 Mejores Prácticas

### 1. Siempre usar `useSafeNavigation` para navegación programática

```typescript
// ✅ BIEN
const { safeVisit } = useSafeNavigation();
safeVisit('/dashboard');

// ❌ MAL
import { router } from '@inertiajs/react';
router.visit('/dashboard'); // Sin protección
```

### 2. Deshabilitar botones durante operaciones asíncronas

```typescript
// ✅ BIEN
const { safePost, isNavigating } = useSafeNavigation();

<button disabled={isNavigating}>
  {isNavigating ? 'Guardando...' : 'Guardar'}
</button>

// ❌ MAL
<button onClick={() => safePost('/api/save', data)}>
  Guardar
</button>
```

### 3. Usar callbacks para feedback al usuario

```typescript
// ✅ BIEN
safePost('/api/items', data, {
  onSuccess: () => toast.success('Guardado exitosamente'),
  onError: (errors) => toast.error('Error al guardar'),
});

// ❌ MAL
safePost('/api/items', data); // Sin feedback
```

### 4. Limpiar estado en `onFinish`

```typescript
// ✅ BIEN
safeVisit('/dashboard', {
  onFinish: () => {
    setIsLoading(false);
    cleanup();
  },
});

// ❌ MAL
safeVisit('/dashboard', {
  onSuccess: () => setIsLoading(false),
  // ¿Qué pasa si hay error o se cancela?
});
```

---

## 📚 Recursos Adicionales

- **Documentación completa:** `resources/js/docs/NAVIGATION_BEST_PRACTICES.md`
- **Ejemplos de código:** `resources/js/Components/examples/SafeNavigationExample.tsx`
- **Resumen del fix:** `NAVIGATION_FIX_SUMMARY.md` (raíz del proyecto)

---

## 🐛 Troubleshooting

### "Transition was skipped" sigue apareciendo

1. Verifica que estés usando `useSafeNavigation` en lugar de `router.visit()` directo
2. Asegúrate de que el manejador global esté activo en `app.tsx`
3. Revisa la consola en modo desarrollo para ver logs de debug

### El botón no se deshabilita durante navegación

1. Verifica que estés usando el estado `isNavigating` del hook
2. Asegúrate de que el botón tenga `disabled={isNavigating}`

### La navegación no funciona

1. Verifica que la ruta exista en el backend
2. Revisa la consola para errores de red
3. Verifica que los callbacks estén correctamente definidos

---

**Última actualización:** 2026-05-11  
**Mantenedor:** Equipo ContentFlow
