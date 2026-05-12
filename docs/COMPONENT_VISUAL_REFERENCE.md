# Visual Component Reference

This document provides a visual representation of how the tracking system components appear.

## PlanTrackingInfoBanner

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚡ Nuevo Sistema de Trazabilidad por Plan                          │
│                                                                       │
│  ┌──────────────────────────────┬──────────────────────────────┐   │
│  │ 🔄 Uso independiente por plan │ 📅 Fecha de inicio           │   │
│  │    Cada plan empieza desde 0  │    El uso se cuenta desde    │   │
│  │                                │    11 de mayo de 2026        │   │
│  └──────────────────────────────┴──────────────────────────────┘   │
│  ┌──────────────────────────────┬──────────────────────────────┐   │
│  │ 🛡️ Addons intactos            │ ⚡ Consumo inteligente        │   │
│  │    Tus addons se mantienen    │    Solo se usan cuando       │   │
│  │    al cambiar de plan         │    excedes tu plan base      │   │
│  └──────────────────────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Green/Emerald gradient background  
**Layout:** 2-column grid (responsive)  
**Icons:** Lucide React components

---

## ExtensionAddonsInfoBanner

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📚 Cómo funcionan los Addons de Extensión                                      │
│                                                                                   │
│  ┌────────────────────┬────────────────────┬────────────────────┐              │
│  │ 🛡️ Independientes   │ 📈 Solo se usan    │ ⇄ FIFO (Primero   │              │
│  │    del plan         │    cuando es       │    en entrar,      │              │
│  │                     │    necesario       │    primero en      │              │
│  │ Tus addons se       │                    │    salir)          │              │
│  │ mantienen al        │ Se activan         │                    │              │
│  │ cambiar de plan     │ automáticamente    │ Se consumen en     │              │
│  │                     │ al exceder tu      │ orden de compra    │              │
│  │                     │ plan base          │                    │              │
│  └────────────────────┴────────────────────┴────────────────────┘              │
│  ┌────────────────────┬────────────────────────────────────────────┐           │
│  │ ⏰ Sin expiración   │ 📚 Trazabilidad por plan                   │           │
│  │                     │                                             │           │
│  │ Los addons de       │ El uso se resetea con cada cambio de plan  │           │
│  │ extensión no        │                                             │           │
│  │ caducan             │                                             │           │
│  └────────────────────┴────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Color Scheme:** Blue/Indigo gradient background  
**Layout:** 3-column grid on large screens, 2-column on medium, 1-column on mobile  
**Icons:** Lucide React components

---

## TrackingSystemInfo (Combined)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚡ Nuevo Sistema de Trazabilidad por Plan                          │
│                                                                       │
│  [PlanTrackingInfoBanner content as shown above]                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

                            ↓ (spacing)

┌─────────────────────────────────────────────────────────────────────┐
│  📚 Cómo funcionan los Addons de Extensión                          │
│                                                                       │
│  [ExtensionAddonsInfoBanner content as shown above]                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Spacing:** `space-y-6` (1.5rem gap between banners)

---

## Icon Legend

### Lucide React Icons Used

| Icon Component | Visual | Meaning | Used In |
|----------------|--------|---------|---------|
| `Zap` | ⚡ | Energy, smart features, power | Both banners |
| `RefreshCw` | 🔄 | Refresh, cycle, reset | Plan Tracking |
| `Calendar` | 📅 | Date, time, scheduling | Plan Tracking |
| `Shield` | 🛡️ | Protection, security, safety | Both banners |
| `Layers` | 📚 | Stacking, organization, levels | Extension Addons |
| `TrendingUp` | 📈 | Growth, increase, upward | Extension Addons |
| `ArrowRightLeft` | ⇄ | Exchange, swap, FIFO | Extension Addons |
| `Clock` | ⏰ | Time, duration, expiration | Extension Addons |

---

## Responsive Behavior

### Mobile (< 768px)
```
┌─────────────────────┐
│  ⚡ Title            │
│                      │
│  ┌────────────────┐ │
│  │ 🔄 Feature 1   │ │
│  │ Description    │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ 📅 Feature 2   │ │
│  │ Description    │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ 🛡️ Feature 3   │ │
│  │ Description    │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ ⚡ Feature 4    │ │
│  │ Description    │ │
│  └────────────────┘ │
└─────────────────────┘
```
**Layout:** Single column, stacked vertically

### Tablet (768px - 1024px)
```
┌───────────────────────────────────────┐
│  ⚡ Title                              │
│                                        │
│  ┌────────────────┬────────────────┐ │
│  │ 🔄 Feature 1   │ 📅 Feature 2   │ │
│  │ Description    │ Description    │ │
│  └────────────────┴────────────────┘ │
│  ┌────────────────┬────────────────┐ │
│  │ 🛡️ Feature 3   │ ⚡ Feature 4    │ │
│  │ Description    │ Description    │ │
│  └────────────────┴────────────────┘ │
└───────────────────────────────────────┘
```
**Layout:** 2-column grid

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────────────────┐
│  📚 Title                                                    │
│                                                               │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ 🛡️ Feature 1 │ 📈 Feature 2 │ ⇄ Feature 3  │            │
│  │ Description  │ Description  │ Description  │            │
│  └──────────────┴──────────────┴──────────────┘            │
│  ┌──────────────┬──────────────────────────────┐           │
│  │ ⏰ Feature 4 │ 📚 Feature 5                 │           │
│  │ Description  │ Description                  │           │
│  └──────────────┴──────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```
**Layout:** 3-column grid (ExtensionAddons), 2-column (PlanTracking)

---

## Dark Mode Comparison

### Light Mode
```
┌─────────────────────────────────────────────────────────────┐
│  Background: Green-50 → Emerald-100 gradient                │
│  Border: Green-200                                           │
│  Title: Gray-900                                             │
│  Icon: Green-600                                             │
│  Text: Gray-700                                              │
└─────────────────────────────────────────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────────────────────────────────────────┐
│  Background: Green-900/20 → Emerald-800/20 gradient         │
│  Border: Green-700/50                                        │
│  Title: White                                                │
│  Icon: Green-400                                             │
│  Text: Gray-300                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
TrackingSystemInfo
├── PlanTrackingInfoBanner
│   ├── Zap (title icon)
│   ├── RefreshCw (independent usage)
│   ├── Calendar (start date)
│   ├── Shield (addons intact)
│   └── Zap (smart consumption)
│
└── ExtensionAddonsInfoBanner
    ├── Layers (title icon)
    ├── Shield (plan independent)
    ├── TrendingUp (only when needed)
    ├── ArrowRightLeft (FIFO)
    ├── Clock (no expiration)
    └── Layers (tracking per plan)
```

---

## CSS Classes Reference

### Container Classes
```css
/* Main container */
.rounded-xl
.border
.bg-gradient-to-br
.p-6

/* Title */
.mb-4
.flex
.items-center
.gap-2
.text-lg
.font-bold

/* Grid container */
.grid
.grid-cols-1
.gap-4
.md:grid-cols-2
.lg:grid-cols-3

/* Feature item */
.flex
.items-start
.gap-3
```

### Color Classes

#### PlanTrackingInfoBanner (Green)
```css
/* Light mode */
.border-green-200
.from-green-50
.to-emerald-100
.text-green-600

/* Dark mode */
.dark:border-green-700/50
.dark:from-green-900/20
.dark:to-emerald-800/20
.dark:text-green-400
```

#### ExtensionAddonsInfoBanner (Blue)
```css
/* Light mode */
.border-blue-200
.from-blue-50
.to-indigo-100
.text-blue-600

/* Dark mode */
.dark:border-blue-700/50
.dark:from-blue-900/20
.dark:to-indigo-800/20
.dark:text-blue-400
```

---

## Integration Example with Full Page

```
┌─────────────────────────────────────────────────────────────┐
│  ContentFlow - Subscription & Addons                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚡ Plan Usage                                       │   │
│  │  [PlanUsageCards - existing component]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚡ Nuevo Sistema de Trazabilidad por Plan          │   │
│  │  [PlanTrackingInfoBanner - NEW]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📚 Cómo funcionan los Addons de Extensión          │   │
│  │  [ExtensionAddonsInfoBanner - NEW]                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓ ¿Cómo funcionan los add-ons?                     │   │
│  │  [AddonsInfoBanner - existing]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Purchase Addons                                     │   │
│  │  [AddonsPurchaseSection - existing]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Accessibility Features

### Semantic HTML
```html
<div role="region" aria-label="Plan tracking information">
  <h3>Title with icon</h3>
  <div role="list">
    <div role="listitem">
      <Icon aria-hidden="true" />
      <div>
        <p>Feature title</p>
        <p>Feature description</p>
      </div>
    </div>
  </div>
</div>
```

### Screen Reader Considerations
- Icons have `aria-hidden="true"` (decorative)
- Text provides full context
- Proper heading hierarchy (h3 for section titles)
- Semantic structure with divs and proper nesting

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus states are visible
- Tab order is logical

---

## Performance Considerations

### Bundle Size
- Lucide React icons are tree-shakeable
- Only imported icons are included in bundle
- Minimal CSS overhead (Tailwind utilities)

### Rendering
- No complex state management
- Pure presentational components
- Fast initial render
- No unnecessary re-renders

### Optimization Tips
```tsx
// Lazy load if not immediately visible
const TrackingSystemInfo = lazy(() => 
  import('@/Components/Subscription/TrackingSystemInfo')
);

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <TrackingSystemInfo />
</Suspense>
```

---

**Last Updated:** May 11, 2026  
**Component Version:** 1.0.0
