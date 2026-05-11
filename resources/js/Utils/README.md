# Utilidades - ContentFlow

Este directorio contiene utilidades reutilizables para la aplicación ContentFlow.

## 🔌 WebSocket / Echo

### `echoHelper.ts`

Utilidades para manejar Laravel Echo de forma segura, previniendo errores de inicialización.

**Problema que resuelve:**
- Echo se carga de forma asíncrona, pero los componentes se montan antes
- Previene crashes por `window.Echo` undefined
- Proporciona retry automático y cleanup seguro

#### Funciones Principales

##### `isEchoReady(): boolean`

Verifica si Echo está inicializado y listo para usar.

```typescript
import { isEchoReady } from '@/Utils/echoHelper';

if (isEchoReady()) {
  // Echo está disponible
}
```

##### `createEchoSubscription(channelName, channelType, setup): () => void`

Crea una suscripción segura a un canal de Echo con cleanup automático.

**Parámetros:**
- `channelName` - Nombre del canal (ej: `'users.123'`)
- `channelType` - Tipo: `'private'`, `'public'`, o `'presence'`
- `setup` - Función que configura los listeners

**Retorna:** Función de cleanup

**Ejemplo básico:**

```typescript
import { createEchoSubscription } from '@/Utils/echoHelper';

useEffect(() => {
  return createEchoSubscription('users.123', 'private', (channel) => {
    channel.listen('.MessageReceived', (event) => {
      console.log('Mensaje:', event.message);
    });
  });
}, [userId]);
```

**Ejemplo con múltiples listeners:**

```typescript
useEffect(() => {
  return createEchoSubscription('users.123', 'private', (channel) => {
    channel.listen('.Event1', handler1);
    channel.listen('.Event2', handler2);
    channel.listen('.Event3', handler3);
  });
}, [userId]);
```

**Ejemplo con Presence Channel:**

```typescript
useEffect(() => {
  return createEchoSubscription('room.123', 'presence', (channel) => {
    channel.here((users) => console.log('Usuarios actuales:', users));
    channel.joining((user) => console.log('Se unió:', user));
    channel.leaving((user) => console.log('Se fue:', user));
  });
}, [roomId]);
```

##### `waitForEcho(callback, maxRetries?, retryDelay?): () => void`

Espera a que Echo esté listo antes de ejecutar un callback.

**Parámetros:**
- `callback` - Función a ejecutar cuando Echo esté listo
- `maxRetries` - Máximo de intentos (default: 50)
- `retryDelay` - Delay entre intentos en ms (default: 100)

**Retorna:** Función para cancelar la espera

```typescript
import { waitForEcho } from '@/Utils/echoHelper';

const cleanup = waitForEcho(() => {
  console.log('Echo está listo!');
  window.Echo.private('channel').listen('.event', handler);
});

// Cancelar si es necesario
cleanup();
```

##### `safeLeaveChannel(channelName: string): void`

Sale de un canal de forma segura (no crashea si Echo no existe).

```typescript
import { safeLeaveChannel } from '@/Utils/echoHelper';

safeLeaveChannel('users.123');
```

#### Características

- ✅ **Retry automático**: Intenta hasta 50 veces (5 segundos total)
- ✅ **Cleanup automático**: Limpia listeners y sale del canal
- ✅ **Type-safe**: Totalmente tipado con TypeScript
- ✅ **Error handling**: Maneja errores gracefully
- ✅ **No crashes**: Nunca crashea por Echo undefined

#### Casos de Uso

##### 1. Hook de React con WebSocket

```typescript
function usePublicationUpdates(userId: number) {
  const [publications, setPublications] = useState([]);

  useEffect(() => {
    if (!userId) return;

    return createEchoSubscription(`users.${userId}`, 'private', (channel) => {
      channel.listen('.PublicationUpdated', (event) => {
        setPublications((prev) => 
          prev.map((p) => (p.id === event.id ? event : p))
        );
      });
    });
  }, [userId]);

  return publications;
}
```

##### 2. Servicio de Realtime

```typescript
export function initNotifications(userId: number) {
  return createEchoSubscription(`users.${userId}`, 'private', (channel) => {
    channel.listen('.NotificationCreated', (event) => {
      toast.success(event.message);
    });
  });
}

// Uso en componente
useEffect(() => {
  const cleanup = initNotifications(userId);
  return cleanup;
}, [userId]);
```

##### 3. Múltiples Canales

```typescript
useEffect(() => {
  const cleanup1 = createEchoSubscription('channel1', 'private', setup1);
  const cleanup2 = createEchoSubscription('channel2', 'private', setup2);

  return () => {
    cleanup1();
    cleanup2();
  };
}, []);
```

#### Migración desde Código Legacy

**Antes:**
```typescript
useEffect(() => {
  if (!window.Echo) return;
  
  const channel = window.Echo.private('users.123');
  channel.listen('.event', handler);
  
  return () => {
    window.Echo.leave('users.123');
  };
}, []);
```

**Después:**
```typescript
useEffect(() => {
  return createEchoSubscription('users.123', 'private', (channel) => {
    channel.listen('.event', handler);
  });
}, []);
```

#### Debugging

Para ver logs de debug en desarrollo:

```typescript
// Los logs aparecen automáticamente en modo desarrollo
// [echoHelper] Echo failed to initialize after 50 retries...
// [echoHelper] Failed to create subscription for users.123: ...
```

---

## 🎯 Otras Utilidades

### `ARIAAnnouncer.ts`

Utilidad para anuncios de accesibilidad (screen readers).

```typescript
import { ariaAnnouncer } from '@/Utils/ARIAAnnouncer';

ariaAnnouncer.announce('Publicación guardada exitosamente');
```

### `FocusManager.ts`

Gestión de foco para accesibilidad.

```typescript
import { FocusManager } from '@/Utils/FocusManager';

FocusManager.initialize();
```

### `FocusVisibleManager.ts`

Gestión de indicadores visuales de foco.

```typescript
import { FocusVisibleManager } from '@/Utils/FocusVisibleManager';

FocusVisibleManager.initialize();
```

---

## 📚 Recursos Adicionales

- **Ejemplos completos:** `resources/js/Components/examples/EchoHelperExample.tsx`
- **Documentación del fix:** `ECHO_INITIALIZATION_FIX.md` (raíz del proyecto)
- **Laravel Echo Docs:** https://laravel.com/docs/broadcasting

---

## 🐛 Troubleshooting

### Echo no se conecta

1. Verificar que Reverb esté corriendo: `docker-compose ps reverb`
2. Verificar variables de entorno en `.env.docker`:
   ```
   VITE_REVERB_APP_KEY=...
   VITE_REVERB_HOST=localhost
   VITE_REVERB_PORT_WS=8081
   ```
3. Verificar en consola del navegador si hay errores de WebSocket

### Listeners no se ejecutan

1. Verificar que el evento tenga el prefijo correcto (`.EventName`)
2. Verificar que el canal sea del tipo correcto (`private`, `public`, `presence`)
3. Verificar autenticación para canales privados

### Memory leaks

1. Asegurarse de retornar la función de cleanup en `useEffect`
2. Verificar que no haya múltiples suscripciones al mismo canal
3. Usar React DevTools Profiler para detectar re-renders

---

**Última actualización:** 2026-05-11  
**Mantenedor:** Equipo ContentFlow
