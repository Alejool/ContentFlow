# Guía de Tema y Accesibilidad

## Resumen de Mejoras Implementadas

### 1. Modo Oscuro Refinado

#### Contraste WCAG AAA
- **Fondo primario oscuro**: `#0a0a0a` (ratio 14.5:1)
- **Texto primario claro**: `#f5f5f5` (ratio 14.5:1)
- **Texto secundario**: `#d4d4d4` (ratio 11.2:1)
- **Texto terciario**: `#a3a3a3` (ratio 7.8:1)

#### Transiciones Suaves
- Duración: 250ms (dentro del rango 200-300ms)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Respeta `prefers-reduced-motion`

#### Persistencia por Workspace
```typescript
// Guardar preferencia de tema por workspace
await themeStorage.saveThemePreference(workspaceId, 'dark');

// Cargar preferencia de tema
const theme = await themeStorage.loadThemePreference(workspaceId);
```

### 2. Microinteracciones

#### Animaciones Sutiles
- **Hover**: Escala 1.02, duración 150ms
- **Tap**: Escala 0.98, duración 150ms
- **Focus**: Ring de 2px con offset de 2px

#### Componentes Animados
```tsx
import { AnimatedButton, AnimatedCard, AnimatedInput } from '@/Components/common/Motion';

// Botón con animación
<AnimatedButton variant="primary" size="md">
  Guardar
</AnimatedButton>

// Card con hover
<AnimatedCard hoverable elevated>
  Contenido
</AnimatedCard>

// Input con focus animation
<AnimatedInput
  label="Email"
  type="email"
  error={errors.email}
/>
```

### 3. Componentes Accesibles

#### Focus Visible Mejorado
```tsx
// Usar el hook en tu aplicación principal
import { useFocusVisible } from '@/Components/common/Accessibility';

function App() {
  useFocusVisible();
  return <YourApp />;
}
```

#### Navegación por Teclado
```tsx
import { useKeyboardNavigation } from '@/Hooks/useKeyboardNavigation';

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  
  useKeyboardNavigation(ref, {
    onEscape: () => closeModal(),
    onEnter: () => submitForm(),
    onArrowUp: () => navigateUp(),
    onArrowDown: () => navigateDown(),
  });
  
  return <div ref={ref}>...</div>;
}
```

#### ARIA Labels Comprehensivos
```tsx
// Modal accesible
<AnimatedModal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirmar acción"
  description="Esta acción no se puede deshacer"
>
  <p>¿Estás seguro?</p>
</AnimatedModal>

// Switch accesible
<AnimatedSwitch
  label="Modo oscuro"
  description="Activa el tema oscuro"
  checked={isDark}
  onCheckedChange={setIsDark}
/>
```

#### Soporte para Lectores de Pantalla
```tsx
import { VisuallyHidden, LiveRegion, useAnnounce } from '@/Components/common/Accessibility';

// Ocultar visualmente pero mantener accesible
<VisuallyHidden>
  Información adicional para lectores de pantalla
</VisuallyHidden>

// Anunciar cambios dinámicos
const { announce } = useAnnounce();
announce('Formulario enviado correctamente', { politeness: 'polite' });

// Live region para actualizaciones
<LiveRegion message="Cargando datos..." politeness="polite" />
```

## Uso de Clases CSS Personalizadas

### Colores de Tema
```css
/* Fondos */
bg-theme-bg-primary      /* Fondo principal */
bg-theme-bg-secondary    /* Fondo secundario */
bg-theme-bg-tertiary     /* Fondo terciario */
bg-theme-bg-elevated     /* Superficies elevadas */

/* Textos */
text-theme-text-primary    /* Texto principal */
text-theme-text-secondary  /* Texto secundario */
text-theme-text-tertiary   /* Texto terciario */
text-theme-text-disabled   /* Texto deshabilitado */

/* Bordes */
border-theme-border-subtle   /* Bordes sutiles */
border-theme-border-default  /* Bordes por defecto */
border-theme-border-strong   /* Bordes fuertes */

/* Estados interactivos */
hover:bg-theme-interactive-hover
active:bg-theme-interactive-active
focus:bg-theme-interactive-focus
```

### Focus Ring
```css
/* Focus ring estándar */
.focus-ring

/* Focus ring interno */
.focus-ring-inset

/* Focus outline */
.focus-outline
```

### Animaciones
```css
/* Duraciones */
duration-instant  /* 0ms */
duration-fast     /* 150ms */
duration-normal   /* 250ms */
duration-slow     /* 350ms */
duration-slower   /* 500ms */

/* Easings */
ease-in-out  /* cubic-bezier(0.4, 0, 0.2, 1) */
ease-out     /* cubic-bezier(0.0, 0, 0.2, 1) */
ease-in      /* cubic-bezier(0.4, 0, 1, 1) */
ease-spring  /* cubic-bezier(0.34, 1.56, 0.64, 1) */

/* Animaciones predefinidas */
animate-fade-in
animate-slide-in
animate-scale-in
```

### Utilidades de Accesibilidad
```css
/* Screen reader only */
.sr-only

/* Screen reader only focusable */
.sr-only-focusable

/* Skip link */
.skip-link

/* Reduced motion */
.motion-safe    /* Solo anima si no hay preferencia de movimiento reducido */
.motion-reduce  /* Desactiva animaciones si hay preferencia */
```

## Ejemplo Completo

```tsx
import React, { useState } from 'react';
import { AnimatedButton, AnimatedCard, AnimatedInput, AnimatedModal } from '@/Components/common/Motion';
import { SkipLink, VisuallyHidden } from '@/Components/common/Accessibility';
import { ThemeToggle } from '@/Components/common/ThemeToggle';
import { useToast } from '@/Hooks/useToast';
import { ToastContainer } from '@/Components/common/Motion';

export default function ExamplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, success, error, removeToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Lógica de envío
      success('Formulario enviado correctamente');
    } catch (err) {
      error('Error al enviar el formulario');
    }
  };

  return (
    <>
      <SkipLink />
      
      <header className="bg-theme-bg-secondary border-b border-theme-border-default p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-theme-text-primary">
            Mi Aplicación
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="p-6">
        <AnimatedCard hoverable elevated padding="lg">
          <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
            Formulario de Ejemplo
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput
              label="Nombre"
              type="text"
              required
              placeholder="Tu nombre"
            />

            <AnimatedInput
              label="Email"
              type="email"
              required
              placeholder="tu@email.com"
            />

            <div className="flex gap-3">
              <AnimatedButton type="submit" variant="primary">
                Enviar
              </AnimatedButton>
              
              <AnimatedButton
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
              >
                Abrir Modal
              </AnimatedButton>
            </div>
          </form>
        </AnimatedCard>
      </main>

      <AnimatedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal de Ejemplo"
        description="Este es un modal completamente accesible"
      >
        <p className="text-theme-text-secondary">
          Contenido del modal con navegación por teclado y focus trap.
        </p>
      </AnimatedModal>

      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
    </>
  );
}
```

## Checklist de Accesibilidad

- ✅ Contraste WCAG AAA (7:1 para texto normal, 4.5:1 para texto grande)
- ✅ Focus visible en todos los elementos interactivos
- ✅ Navegación completa por teclado
- ✅ ARIA labels y roles apropiados
- ✅ Soporte para lectores de pantalla
- ✅ Respeto a `prefers-reduced-motion`
- ✅ Skip links para navegación rápida
- ✅ Live regions para contenido dinámico
- ✅ Focus trap en modales
- ✅ Roving tabindex en listas

## Recursos Adicionales

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Framer Motion Accessibility](https://www.framer.com/motion/accessibility/)
