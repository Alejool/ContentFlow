# Addons Components

Este directorio contiene los componentes relacionados con el sistema de addons (paquetes adicionales) del workspace.

## Arquitectura

La arquitectura sigue el patrón de **separación de lógica y presentación**:

```
┌─────────────────────────────────────────┐
│         AddonsSummary.tsx               │
│      (Componente Contenedor)            │
│                                         │
│  - useAddonsSummary() hook              │
│  - Lógica de formateo                   │
│  - Composición de componentes           │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────────┐   ┌────────▼─────────┐
│  Store (Zustand) │   │  Componentes de  │
│                  │   │   Presentación   │
│ - Estado global  │   │                  │
│ - Fetch data     │   │ - Header         │
│ - Error handling │   │ - Empty          │
└──────────────────┘   │ - TrackingInfo   │
                       │ - ExtensionInfo  │
                       │ - UsageDisplay   │
                       └──────────────────┘
```

## Componentes

### 1. `AddonsSummary.tsx` (Contenedor)
Componente principal que orquesta la lógica y composición.

**Responsabilidades:**
- Obtener datos del hook `useAddonsSummary()`
- Formatear fechas según el idioma del usuario
- Renderizar estados de carga y error
- Componer los componentes de presentación

**No hace:**
- Fetch directo de datos
- Manejo de estado local complejo
- Lógica de negocio

### 2. `AddonsSummaryHeader.tsx` (Presentación)
Muestra el encabezado con información del plan actual.

**Props:**
- `currentPlan`: Nombre del plan actual
- `planStartedAt?`: Fecha de inicio del plan
- `formatDate`: Función para formatear fechas

### 3. `AddonsSummaryEmpty.tsx` (Presentación)
Estado vacío cuando no hay addons activos.

**Props:** Ninguna (usa traducciones)

### 4. `AddonTrackingInfo.tsx` (Presentación)
Información sobre el sistema de trazabilidad por plan.

**Props:**
- `planStartedAt?`: Fecha de inicio del plan
- `formatDate`: Función para formatear fechas

### 5. `AddonExtensionInfo.tsx` (Presentación)
Información sobre cómo funcionan los addons de extensión (FIFO, etc.).

**Props:** Ninguna (usa traducciones)

### 6. `AddonUsageDisplay.tsx` (Presentación)
Muestra el uso individual de cada tipo de addon.

**Props:**
- `type`: Tipo de addon (ai_credits, storage, etc.)
- `name`: Nombre traducido
- `planLimit`: Límite del plan base
- `currentUsage`: Uso actual
- `addonTotal`: Total de addons comprados
- `addonUsed`: Addons usados
- `addonRemaining`: Addons restantes
- `unit`: Unidad de medida

## Store

### `addonsSummaryStore.ts`
Store de Zustand para gestionar el estado de los addons.

**Estado:**
```typescript
{
  data: AddonsSummaryData | null;
  loading: boolean;
  error: string | null;
}
```

**Acciones:**
- `fetchSummary()`: Obtiene el resumen de addons desde la API
- `reset()`: Resetea el estado

## Hook

### `useAddonsSummary.ts`
Hook personalizado que encapsula la lógica de obtención de datos.

**Retorna:**
```typescript
{
  data: AddonsSummaryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Características:**
- Auto-fetch al montar el componente
- Previene fetches duplicados
- Proporciona función `refetch` para recargar datos

## Flujo de Datos

```
1. Componente monta
   ↓
2. useAddonsSummary() hook se ejecuta
   ↓
3. Hook verifica si hay datos en el store
   ↓
4. Si no hay datos, llama a fetchSummary()
   ↓
5. Store hace fetch a /api/v1/addons/summary
   ↓
6. Store actualiza el estado
   ↓
7. Hook retorna los datos actualizados
   ↓
8. Componente renderiza con los datos
```

## Traducciones

Todas las cadenas de texto usan el sistema `i18n` con el namespace `subscription.addons`.

**Interpolación de fechas:**
```typescript
// ✅ Correcto
t('subscription.addons.newTrackingSystem.startDateDesc', {
  date: formatDate(planStartedAt)
})

// ❌ Incorrecto (doble formateo)
t('subscription.addons.newTrackingSystem.startDateDesc', {
  date: formatDate(formatDate(planStartedAt))
})
```

La clave `{date}` en las traducciones se reemplaza con la fecha formateada pasada como parámetro.

## Tipos

Los tipos están definidos en `resources/js/types/addon.ts`:

```typescript
interface AddonSummaryItem {
  total: number;
  used: number;
  available: number;
  percentage: number;
  plan_limit: number;
  current_usage: number;
  excess_usage: number;
}

interface AddonsSummaryData {
  summary: {
    ai_credits: AddonSummaryItem;
    storage: AddonSummaryItem;
    publications: AddonSummaryItem;
    team_members: AddonSummaryItem;
  };
  plan_info: {
    current_plan: string;
    limits: Record<string, number | boolean | null>;
    plan_started_at?: string;
  };
}
```

## Uso

```tsx
import AddonsSummary from '@/Components/Addons/AddonsSummary';

function MyPage() {
  return (
    <div>
      <h1>Mis Addons</h1>
      <AddonsSummary />
    </div>
  );
}
```

## Testing

Para testear componentes de presentación:
```typescript
import { render } from '@testing-library/react';
import AddonsSummaryHeader from './AddonsSummaryHeader';

test('renders plan name', () => {
  const { getByText } = render(
    <AddonsSummaryHeader
      currentPlan="pro"
      formatDate={(date) => date || 'N/A'}
    />
  );
  expect(getByText(/Pro/i)).toBeInTheDocument();
});
```

Para testear el hook:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAddonsSummary } from './useAddonsSummary';

test('fetches data on mount', async () => {
  const { result } = renderHook(() => useAddonsSummary());
  
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

## Mejoras Futuras

- [ ] Agregar tests unitarios
- [ ] Implementar caché con TTL en el store
- [ ] Agregar optimistic updates al comprar addons
- [ ] Implementar skeleton loaders más específicos
- [ ] Agregar animaciones de transición entre estados
