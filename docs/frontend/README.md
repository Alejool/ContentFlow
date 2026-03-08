# Documentación Frontend

Guías de desarrollo frontend, componentes UI y PWA.

## Documentos Disponibles

- **THEME_ACCESSIBILITY_GUIDE.md** - Temas, modo oscuro y accesibilidad
- **SKELETON_LOADERS_GUIDE.md** - Componentes de carga skeleton
- **SERVICE_WORKER_GUIDE.md** - Service Workers y PWA

## Componentes Principales

### Temas y Accesibilidad
- Modo oscuro con contraste WCAG AAA
- Microinteracciones y animaciones
- Navegación por teclado
- Soporte para lectores de pantalla

### Skeleton Loaders
- TableRowSkeleton
- GridSkeleton
- ListSkeleton
- ReelCardSkeleton
- FormSkeleton

### PWA
- Service Worker con caching inteligente
- Offline functionality
- Background sync
- Push notifications

## Inicio Rápido

### Usar Componentes Animados
```tsx
import { AnimatedButton, AnimatedCard } from '@/Components/common/Motion';

<AnimatedButton variant="primary">
  Guardar
</AnimatedButton>
```

### Skeleton Loaders
```tsx
import { GridSkeleton } from '@/Components/common/ui/skeletons';

{loading ? <GridSkeleton items={6} /> : <ContentGrid />}
```

### Service Worker
```tsx
import { useServiceWorker } from '@/hooks/useServiceWorker';

const { hasUpdate, updateServiceWorker } = useServiceWorker();
```

Ver guías individuales para documentación completa.
