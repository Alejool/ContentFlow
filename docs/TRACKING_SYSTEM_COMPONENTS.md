# Plan Tracking System Components

This document describes the new components created to display information about the plan-based tracking system and extension addons.

## Components

### 1. PlanTrackingInfoBanner

Displays information about the new plan-based tracking system with Lucide React icons.

**Location:** `resources/js/Components/Subscription/PlanTrackingInfoBanner.tsx`

**Props:**
- `startDate?: string` - The date when usage tracking started (optional)

**Icons Used:**
- `Zap` - Main title icon (Smart consumption)
- `RefreshCw` - Independent usage per plan
- `Calendar` - Start date
- `Shield` - Addons intact

**Translation Keys:**
```typescript
subscription.addons.newTrackingSystem.title
subscription.addons.newTrackingSystem.independentUsage
subscription.addons.newTrackingSystem.independentUsageDesc
subscription.addons.newTrackingSystem.startDate
subscription.addons.newTrackingSystem.startDateDesc
subscription.addons.newTrackingSystem.addonsIntact
subscription.addons.newTrackingSystem.addonsIntactDesc
subscription.addons.newTrackingSystem.smartConsumption
subscription.addons.newTrackingSystem.smartConsumptionDesc
```

**Usage Example:**
```tsx
import { PlanTrackingInfoBanner } from '@/Components/Subscription/PlanTrackingInfoBanner';

function MyPage() {
  return (
    <div>
      <PlanTrackingInfoBanner startDate="11 de mayo de 2026 a las 18:03" />
    </div>
  );
}
```

---

### 2. ExtensionAddonsInfoBanner

Displays information about how extension addons work with Lucide React icons.

**Location:** `resources/js/Components/Subscription/ExtensionAddonsInfoBanner.tsx`

**Props:** None

**Icons Used:**
- `Layers` - Main title icon
- `Shield` - Plan independent
- `TrendingUp` - Only when needed
- `ArrowRightLeft` - FIFO (First In, First Out)
- `Clock` - No expiration
- `Layers` - Tracking per plan

**Translation Keys:**
```typescript
subscription.addons.extensionAddons.title
subscription.addons.extensionAddons.planIndependent
subscription.addons.extensionAddons.planIndependentDesc
subscription.addons.extensionAddons.onlyWhenNeeded
subscription.addons.extensionAddons.onlyWhenNeededDesc
subscription.addons.extensionAddons.fifo
subscription.addons.extensionAddons.fifoDesc
subscription.addons.extensionAddons.noExpiration
subscription.addons.extensionAddons.noExpirationDesc
subscription.addons.extensionAddons.trackingPerPlan
subscription.addons.extensionAddons.trackingPerPlanDesc
```

**Usage Example:**
```tsx
import { ExtensionAddonsInfoBanner } from '@/Components/Subscription/ExtensionAddonsInfoBanner';

function MyPage() {
  return (
    <div>
      <ExtensionAddonsInfoBanner />
    </div>
  );
}
```

---

### 3. TrackingSystemInfo

Wrapper component that displays both banners together with flexible configuration.

**Location:** `resources/js/Components/Subscription/TrackingSystemInfo.tsx`

**Props:**
- `startDate?: string` - The date when usage tracking started (optional)
- `showExtensionInfo?: boolean` - Show extension addons info (default: true)
- `showTrackingInfo?: boolean` - Show tracking system info (default: true)

**Usage Examples:**

```tsx
import { TrackingSystemInfo } from '@/Components/Subscription/TrackingSystemInfo';

// Show both banners
function Example1() {
  return <TrackingSystemInfo startDate="11 de mayo de 2026 a las 18:03" />;
}

// Show only tracking info
function Example2() {
  return <TrackingSystemInfo showExtensionInfo={false} />;
}

// Show only extension addons info
function Example3() {
  return <TrackingSystemInfo showTrackingInfo={false} />;
}
```

---

## Integration Example

Here's how to integrate these components into the Addons page:

```tsx
import { TrackingSystemInfo } from '@/Components/Subscription/TrackingSystemInfo';
import { AddonsInfoBanner } from '@/Components/Subscription/AddonsInfoBanner';
import { PlanUsageCards } from '@/Components/Subscription/PlanUsageCards';

export default function Addons() {
  return (
    <AuthenticatedLayout>
      <div className="py-12">
        <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
          {/* Plan Usage Cards */}
          <PlanUsageCards />

          {/* New Tracking System Information */}
          <TrackingSystemInfo startDate="11 de mayo de 2026 a las 18:03" />

          {/* Original Addons Info */}
          <AddonsInfoBanner />

          {/* Rest of the page... */}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
```

---

## Translations

### Spanish (es)

```json
{
  "subscription": {
    "addons": {
      "newTrackingSystem": {
        "title": "Nuevo Sistema de Trazabilidad por Plan",
        "independentUsage": "Uso independiente por plan",
        "independentUsageDesc": "Cada plan empieza desde 0",
        "startDate": "Fecha de inicio",
        "startDateDesc": "El uso se cuenta desde {date}",
        "addonsIntact": "Addons intactos",
        "addonsIntactDesc": "Tus addons se mantienen al cambiar de plan",
        "smartConsumption": "Consumo inteligente",
        "smartConsumptionDesc": "Solo se usan cuando excedes tu plan base"
      },
      "extensionAddons": {
        "title": "Cómo funcionan los Addons de Extensión",
        "planIndependent": "Independientes del plan",
        "planIndependentDesc": "Tus addons se mantienen al cambiar de plan",
        "onlyWhenNeeded": "Solo se usan cuando es necesario",
        "onlyWhenNeededDesc": "Se activan automáticamente al exceder tu plan base",
        "fifo": "FIFO (Primero en entrar, primero en salir)",
        "fifoDesc": "Se consumen en orden de compra",
        "noExpiration": "Sin expiración",
        "noExpirationDesc": "Los addons de extensión no caducan",
        "trackingPerPlan": "Trazabilidad por plan",
        "trackingPerPlanDesc": "El uso se resetea con cada cambio de plan"
      }
    }
  }
}
```

### English (en)

```json
{
  "subscription": {
    "addons": {
      "newTrackingSystem": {
        "title": "New Plan-Based Tracking System",
        "independentUsage": "Independent usage per plan",
        "independentUsageDesc": "Each plan starts from 0",
        "startDate": "Start date",
        "startDateDesc": "Usage is counted from {date}",
        "addonsIntact": "Addons intact",
        "addonsIntactDesc": "Your addons remain when changing plans",
        "smartConsumption": "Smart consumption",
        "smartConsumptionDesc": "Only used when you exceed your base plan"
      },
      "extensionAddons": {
        "title": "How Extension Addons Work",
        "planIndependent": "Plan independent",
        "planIndependentDesc": "Your addons remain when changing plans",
        "onlyWhenNeeded": "Only used when needed",
        "onlyWhenNeededDesc": "Automatically activated when exceeding your base plan",
        "fifo": "FIFO (First In, First Out)",
        "fifoDesc": "Consumed in purchase order",
        "noExpiration": "No expiration",
        "noExpirationDesc": "Extension addons don't expire",
        "trackingPerPlan": "Tracking per plan",
        "trackingPerPlanDesc": "Usage resets with each plan change"
      }
    }
  }
}
```

---

## Icon Mapping

| Feature | Icon | Lucide Component |
|---------|------|------------------|
| New Tracking System | ⚡ | `Zap` |
| Independent Usage | 🔄 | `RefreshCw` |
| Start Date | 📅 | `Calendar` |
| Addons Intact | 🛡️ | `Shield` |
| Smart Consumption | ⚡ | `Zap` |
| Extension Addons | 📚 | `Layers` |
| Plan Independent | 🛡️ | `Shield` |
| Only When Needed | 📈 | `TrendingUp` |
| FIFO | ⇄ | `ArrowRightLeft` |
| No Expiration | ⏰ | `Clock` |
| Tracking Per Plan | 📚 | `Layers` |

---

## Styling

All components use:
- Tailwind CSS for styling
- Dark mode support with `dark:` variants
- Responsive grid layouts (`md:grid-cols-2`, `lg:grid-cols-3`)
- Gradient backgrounds for visual appeal
- Consistent spacing and typography

### Color Schemes

- **PlanTrackingInfoBanner**: Green/Emerald theme (success, growth)
- **ExtensionAddonsInfoBanner**: Blue/Indigo theme (trust, stability)

---

## Accessibility

All components include:
- Semantic HTML structure
- Proper heading hierarchy
- Icon + text combinations (not icon-only)
- Sufficient color contrast for dark/light modes
- Responsive design for mobile devices

---

## Testing

To test these components:

1. Import them into your page
2. Verify translations load correctly in both languages
3. Test dark mode appearance
4. Test responsive behavior on mobile/tablet/desktop
5. Verify icons render correctly

```tsx
// Test component
import { TrackingSystemInfo } from '@/Components/Subscription/TrackingSystemInfo';

export default function TestPage() {
  return (
    <div className="p-8 space-y-8">
      <h1>Testing Tracking System Components</h1>
      
      {/* Test with date */}
      <TrackingSystemInfo startDate="May 11, 2026 at 6:03 PM" />
      
      {/* Test without date */}
      <TrackingSystemInfo />
      
      {/* Test individual components */}
      <TrackingSystemInfo showExtensionInfo={false} />
      <TrackingSystemInfo showTrackingInfo={false} />
    </div>
  );
}
```
