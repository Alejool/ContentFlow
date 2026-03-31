# Guía de Skeleton Loaders

## Descripción

Los skeleton loaders son componentes visuales que muestran una representación esquemática del contenido mientras se carga, mejorando la percepción de velocidad y proporcionando una mejor experiencia de usuario.

## Componentes Disponibles

### 1. Skeleton Base
**Ubicación:** `resources/js/Components/common/ui/Skeleton.tsx`

Componente base con animación shimmer:

```tsx
import Skeleton from "@/Components/common/ui/Skeleton";

<Skeleton className="h-4 w-32" />
<Skeleton variant="circle" className="w-10 h-10" />
<Skeleton variant="text" />
```

**Props:**
- `className`: Clases CSS personalizadas
- `variant`: "rectangle" | "circle" | "text"
- `shimmer`: boolean (default: true)

### 2. Skeleton Loaders Especializados

#### TableRowSkeleton
Para filas de tablas:
```tsx
import TableRowSkeleton from "@/Components/common/ui/skeletons/TableRowSkeleton";

<TableRowSkeleton columns={5} hasActions={true} />
```

#### GridSkeleton
Para grillas de contenido:
```tsx
import GridSkeleton from "@/Components/common/ui/skeletons/GridSkeleton";

<GridSkeleton items={6} columns={3} cardHeight="h-64" />
```

#### ListSkeleton
Para listas:
```tsx
import ListSkeleton from "@/Components/common/ui/skeletons/ListSkeleton";

<ListSkeleton items={5} hasAvatar={true} hasActions={true} />
```

#### ReelCardSkeleton
Para tarjetas de reels/videos:
```tsx
import ReelCardSkeleton from "@/Components/common/ui/skeletons/ReelCardSkeleton";

<ReelCardSkeleton />
```

#### SocialAccountCardSkeleton
Para tarjetas de cuentas sociales:
```tsx
import SocialAccountCardSkeleton from "@/Components/common/ui/skeletons/SocialAccountCardSkeleton";

<SocialAccountCardSkeleton />
```

#### AnalyticsCardSkeleton
Para tarjetas de analytics:
```tsx
import AnalyticsCardSkeleton from "@/Components/common/ui/skeletons/AnalyticsCardSkeleton";

<AnalyticsCardSkeleton />
```

#### FormSkeleton
Para formularios:
```tsx
import FormSkeleton from "@/Components/common/ui/skeletons/FormSkeleton";

<FormSkeleton fields={4} hasSubmitButton={true} />
```

#### PageHeaderSkeleton
Para encabezados de página:
```tsx
import PageHeaderSkeleton from "@/Components/common/ui/skeletons/PageHeaderSkeleton";

<PageHeaderSkeleton />
```

#### CalendarEventSkeleton
Para eventos de calendario:
```tsx
import CalendarEventSkeleton from "@/Components/common/ui/skeletons/CalendarEventSkeleton";

<CalendarEventSkeleton />
```

## Patrones de Uso

### Reemplazar Spinners Simples

❌ **Antes:**
```tsx
{loading ? (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin" />
  </div>
) : (
  <ContentGrid />
)}
```

✅ **Después:**
```tsx
{loading ? (
  <GridSkeleton items={6} columns={3} />
) : (
  <ContentGrid />
)}
```

### Skeleton en Grillas

```tsx
{loading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <ContentCardSkeleton key={index} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(item => <ContentCard key={item.id} {...item} />)}
  </div>
)}
```

### Skeleton en Tablas

```tsx
<table>
  <thead>...</thead>
  <tbody>
    {loading ? (
      Array.from({ length: 5 }).map((_, index) => (
        <TableRowSkeleton key={index} columns={6} hasActions={true} />
      ))
    ) : (
      data.map(row => <TableRow key={row.id} {...row} />)
    )}
  </tbody>
</table>
```

### Skeleton en Listas

```tsx
{loading ? (
  <ListSkeleton items={5} hasAvatar={true} hasActions={true} />
) : (
  <div className="space-y-3">
    {items.map(item => <ListItem key={item.id} {...item} />)}
  </div>
)}
```

## Mejores Prácticas

1. **Mantener la estructura visual:** El skeleton debe reflejar la estructura del contenido real
2. **Cantidad apropiada:** Mostrar la cantidad de items que típicamente se cargan
3. **Responsive:** Los skeletons deben adaptarse a diferentes tamaños de pantalla
4. **Consistencia:** Usar los mismos skeletons para contenido similar
5. **No abusar:** Para cargas muy rápidas (<200ms), considerar no mostrar skeleton

## Cuándo Usar Skeleton vs Spinner

### Usar Skeleton cuando:
- Carga de listas o grillas de contenido
- Carga de páginas completas
- Carga de secciones con estructura conocida
- Operaciones que toman >500ms

### Usar Spinner cuando:
- Operaciones en botones (guardar, eliminar)
- Operaciones muy rápidas (<200ms)
- Procesos sin estructura visual clara
- Indicadores de progreso en modales

## Implementaciones Existentes

### Componentes con Skeleton
- ✅ `PublicationRowSkeleton` - Filas de publicaciones
- ✅ `PublicationMobileRowSkeleton` - Filas móviles de publicaciones
- ✅ `ContentCardSkeleton` - Tarjetas de contenido
- ✅ `StatCardSkeleton` - Tarjetas de estadísticas
- ✅ `LogCardSkeleton` - Tarjetas de logs
- ✅ `LogRowSkeleton` - Filas de logs
- ✅ `ActivityLogSkeleton` - Logs de actividad

### Páginas Actualizadas
- ✅ `AiReelsGallery` - Galería de reels con GridSkeleton
- ✅ `SocialMediaAccounts` - Cuentas sociales con SocialAccountCardSkeleton

## Próximos Pasos

### Componentes Pendientes
- [ ] Dashboard - Agregar skeletons para estadísticas
- [ ] Calendar - Agregar CalendarEventSkeleton
- [ ] Analytics - Agregar AnalyticsCardSkeleton
- [ ] Settings - Agregar FormSkeleton
- [ ] Portal del Cliente - Agregar skeletons apropiados

### Mejoras Futuras
- [ ] Skeleton con contenido progresivo (mostrar datos parciales)
- [ ] Skeleton con animaciones más sofisticadas
- [ ] Skeleton adaptativo basado en velocidad de conexión
- [ ] Skeleton con placeholders de contenido real

## Recursos

- [Skeleton UI Patterns](https://www.nngroup.com/articles/skeleton-screens/)
- [Best Practices for Skeleton Screens](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)
