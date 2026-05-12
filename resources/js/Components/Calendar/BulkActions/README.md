# BulkActions Components

Componentes modulares para las acciones masivas del calendario.

## Estructura

```
BulkActions/
├── index.ts              # Exportaciones centralizadas
├── SelectionInfo.tsx     # Información de selección con progreso circular
├── ActionButtons.tsx     # Botones de acción (seleccionar, deshacer, mover, cerrar)
├── MoveModal.tsx         # Modal para mover eventos
├── DeleteModal.tsx       # Modal para eliminar eventos
└── README.md            # Esta documentación
```

## Componentes

### SelectionInfo
Muestra información sobre los eventos seleccionados con un indicador de progreso circular animado.

**Props:**
- `selectedCount: number` - Cantidad de eventos seleccionados
- `totalEvents: number` - Total de eventos disponibles

**Características:**
- Progreso circular animado con Framer Motion
- Muestra porcentaje de selección
- Icono de check cuando todos están seleccionados

### ActionButtons
Botones de acción para gestionar la selección.

**Props:**
- `selectedCount: number` - Cantidad de eventos seleccionados
- `totalEvents: number` - Total de eventos disponibles
- `canUndo?: boolean` - Si se puede deshacer la última acción
- `onSelectAll: () => void` - Callback para seleccionar todos
- `onUndo?: () => void` - Callback para deshacer
- `onMove: () => void` - Callback para abrir modal de mover
- `onClearSelection: () => void` - Callback para limpiar selección

**Características:**
- Animaciones de entrada/salida con Framer Motion
- Botón "Seleccionar todos" condicional
- Botón "Deshacer" condicional
- Efectos hover y tap

### MoveModal
Modal para mover eventos a una nueva fecha.

**Props:**
- `isOpen: boolean` - Estado del modal
- `onClose: () => void` - Callback para cerrar
- `selectedCount: number` - Cantidad de eventos a mover
- `selectedDate: Date` - Fecha seleccionada
- `onDateChange: (date: Date) => void` - Callback al cambiar fecha
- `onConfirm: () => Promise<void>` - Callback para confirmar
- `isMoving: boolean` - Estado de carga

**Características:**
- Banner informativo con gradiente
- Selector de fecha con validación
- Vista previa de fecha formateada
- Animaciones escalonadas

### DeleteModal
Modal para eliminar eventos con confirmación.

**Props:**
- `isOpen: boolean` - Estado del modal
- `onClose: () => void` - Callback para cerrar
- `selectedCount: number` - Cantidad de eventos a eliminar
- `onConfirm: () => Promise<void>` - Callback para confirmar
- `isDeleting: boolean` - Estado de carga

**Características:**
- Banner de advertencia con gradiente rojo
- Información de eventos a eliminar
- Confirmación explícita
- Animaciones de advertencia

## Uso

```tsx
import { BulkActionsBar } from '@/Components/Calendar/BulkActionsBar';

<BulkActionsBar
  selectedCount={5}
  totalEvents={20}
  onClearSelection={() => {}}
  onBulkMove={async (date) => {}}
  onBulkDelete={async (ids) => {}}
  onSelectAll={() => {}}
  canUndo={true}
  onUndo={() => {}}
  selectedEventIds={['1', '2', '3']}
/>
```

## Dependencias

- `framer-motion` - Animaciones
- `react-i18next` - Traducciones
- `lucide-react` - Iconos
- `@/Components/common/Modern/*` - Componentes base
- `@/Hooks/Calendar/useBulkActions` - Hook de lógica
- `@/Utils/Calendar/bulkActionsHelpers` - Funciones auxiliares

## Mejoras Implementadas

### Diseño
- ✅ Gradientes decorativos en modales
- ✅ Progreso circular animado
- ✅ Sombras y efectos de profundidad mejorados
- ✅ Separadores con gradientes
- ✅ Backdrop blur en la barra principal

### Animaciones
- ✅ Entrada/salida suave con Framer Motion
- ✅ Animaciones escalonadas en modales
- ✅ Efectos hover y tap en botones
- ✅ Transiciones de escala y opacidad

### Arquitectura
- ✅ Separación de lógica en hook personalizado
- ✅ Helpers para funciones auxiliares
- ✅ Componentes modulares y reutilizables
- ✅ Props tipadas con TypeScript
- ✅ Documentación completa

### UX
- ✅ Validación de fechas en el pasado
- ✅ Estados de carga en acciones
- ✅ Feedback visual mejorado
- ✅ Confirmaciones explícitas
- ✅ Información contextual clara
