# Componentes Modernos - React Aria Components

Colección de componentes UI modernos construidos con React Aria Components para Intellipost.

## 🎯 Filosofía

- **Accesibilidad primero**: Todos los componentes cumplen WCAG 2.1 AA
- **Composición**: Componentes pequeños y reutilizables
- **TypeScript**: Tipos completos para mejor DX
- **Tailwind CSS**: Estilos utilitarios y personalizables
- **Performance**: Optimizados para producción

## 📦 Componentes Disponibles

### Formularios

#### Switch
Componente de toggle/switch con soporte completo de accesibilidad.

```tsx
import Switch from '@/Components/common/Modern/Switch';

<Switch 
  label="Habilitar notificaciones"
  description="Recibe alertas en tiempo real"
  isSelected={enabled} 
  onChange={setEnabled}
/>
```

**Variantes:**
- `Switch.tsx` - Básico con label y description
- `AnimatedSwitch.tsx` - Con animaciones de Framer Motion
- `ToggleSwitch.tsx` - Versión legacy compatible

**Documentación:** `SWITCH_MIGRATION.md`

---

#### DatePicker
Selector de fecha con calendario visual y soporte de internacionalización.

```tsx
import DatePicker from '@/Components/common/Modern/DatePicker';

<DatePicker
  label="Fecha de publicación"
  value={date}
  onChange={setDate}
  minValue={today()}
/>
```

**Características:**
- Calendario visual con navegación
- Soporte de i18n (es, en)
- Validación de rangos
- Formato personalizable

---

#### Input
Input de texto con validación y estados.

```tsx
import Input from '@/Components/common/Modern/Input';

<Input
  label="Nombre"
  placeholder="Ingresa tu nombre"
  value={name}
  onChange={setName}
  error={errors.name}
/>
```

---

#### Textarea
Área de texto con contador de caracteres.

```tsx
import Textarea from '@/Components/common/Modern/Textarea';

<Textarea
  label="Descripción"
  rows={5}
  maxLength={500}
  value={description}
  onChange={setDescription}
/>
```

---

#### Select / ListBox
Selector con opciones y búsqueda.

```tsx
import { ListBox } from '@/Components/common/Modern/ListBox';

<ListBox
  label="Plataforma"
  items={platforms}
  selectedKey={platform}
  onSelectionChange={setPlatform}
/>
```

---

### Navegación

#### Tabs
Pestañas con navegación por teclado.

```tsx
import Tabs from '@/Components/common/Modern/Tabs';

<Tabs
  tabs={[
    { id: 'general', label: 'General', content: <GeneralTab /> },
    { id: 'advanced', label: 'Avanzado', content: <AdvancedTab /> }
  ]}
/>
```

**Documentación:** `TABS_MIGRATION.md`

---

### Overlays

#### Popover
Componente base para modales, dropdowns y tooltips.

```tsx
import { Popover } from '@/Components/common/Modern/Popover';

<Popover
  trigger={<button>Abrir</button>}
  placement="bottom end"
>
  <div className="p-4">Contenido</div>
</Popover>
```

**Características:**
- Posicionamiento inteligente
- Focus management automático
- Cierre con ESC
- Animaciones suaves

**Documentación:** `POPOVER_MIGRATION.md`

---

#### ContextMenu
Menú contextual con secciones y acciones.

```tsx
import { ContextMenu } from '@/Components/common/Modern/ContextMenu';

<ContextMenu
  trigger={<button>Acciones</button>}
  sections={[
    {
      items: [
        { label: 'Editar', onClick: handleEdit },
        { label: 'Duplicar', onClick: handleDuplicate }
      ]
    },
    {
      items: [
        { label: 'Eliminar', onClick: handleDelete, variant: 'danger' }
      ]
    }
  ]}
/>
```

---

### Feedback

#### Button
Botón con variantes y estados de loading.

```tsx
import Button from '@/Components/common/Modern/Button';

<Button
  variant="primary"
  size="md"
  loading={isLoading}
  onClick={handleSubmit}
>
  Guardar
</Button>
```

**Variantes:**
- `primary` - Acción principal
- `secondary` - Acción secundaria
- `danger` - Acción destructiva
- `ghost` - Sin fondo

---

## 🔄 Componentes Migrados

### Dropdowns

#### ProfileDropdown
Dropdown de perfil de usuario con configuración.

```tsx
import ProfileDropdown from '@/Components/Layout/ProfileDropdown.modern';

<ProfileDropdown user={user} isProfileActive={isActive} />
```

**Incluye:**
- Avatar con estado
- Selector de tema y color
- Selector de idioma
- Información de plan
- Links a perfil y logout

---

#### WorkspaceDropdown
Dropdown de selección de workspace.

```tsx
import WorkspaceDropdown from '@/Components/Workspace/WorkspaceDropdown.modern';

<WorkspaceDropdown
  workspaces={workspaces}
  current_workspace={current}
  onSwitch={handleSwitch}
/>
```

---

### Modales

#### ConfirmDialog
Diálogo de confirmación con variantes.

```tsx
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog.modern';

<ConfirmDialog
  trigger={<button>Eliminar</button>}
  title="¿Eliminar publicación?"
  message="Esta acción no se puede deshacer"
  type="danger"
  onConfirm={handleDelete}
/>
```

---

#### RejectionReasonModal
Modal para ingresar razón de rechazo.

```tsx
import RejectionReasonModal from '@/Components/Content/modals/RejectionReasonModal.modern';

<RejectionReasonModal
  trigger={<button>Rechazar</button>}
  publicationTitle={title}
  onSubmit={handleReject}
/>
```

---

## 📚 Guías de Migración

- **Switch**: `SWITCH_MIGRATION.md`
- **Popover**: `POPOVER_MIGRATION.md`
- **Tabs**: `TABS_MIGRATION.md`

## 🎨 Personalización

### Estilos con Tailwind

Todos los componentes aceptan `className` para personalización:

```tsx
<Switch 
  className="custom-switch"
  label="Mi switch"
/>
```

### Temas

Los componentes respetan el tema del sistema (light/dark):

```tsx
// Automático según preferencia del usuario
<Button variant="primary">Guardar</Button>

// Clases dark: aplicadas automáticamente
className="bg-white dark:bg-neutral-800"
```

### Colores Primarios

Los componentes usan variables CSS para colores:

```css
:root {
  --color-primary-500: #f97316; /* orange */
  --color-primary-600: #ea580c;
}
```

Cambiar en `cssPropertiesManager.applyPrimaryColor(color)`.

## 🧪 Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Switch from './Switch';

test('toggle switch', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  
  render(<Switch label="Test" onChange={onChange} />);
  
  await user.click(screen.getByRole('switch'));
  expect(onChange).toHaveBeenCalledWith(true);
});
```

### Accessibility Tests

```tsx
import { axe } from 'jest-axe';

test('no accessibility violations', async () => {
  const { container } = render(<Switch label="Test" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🔧 Desarrollo

### Agregar Nuevo Componente

1. Crear archivo en `resources/js/Components/common/Modern/`
2. Usar React Aria Components como base
3. Agregar tipos TypeScript
4. Documentar props y ejemplos
5. Agregar tests
6. Actualizar este README

### Estructura de Archivo

```tsx
import { Component } from 'react-aria-components';
import { ReactNode } from 'react';

interface MyComponentProps {
  label: string;
  children: ReactNode;
  // ... más props
}

/**
 * MyComponent - Descripción breve
 * 
 * Características:
 * - Feature 1
 * - Feature 2
 * 
 * @example
 * <MyComponent label="Test">
 *   Content
 * </MyComponent>
 */
export function MyComponent({ label, children }: MyComponentProps) {
  return (
    <Component>
      {/* Implementation */}
    </Component>
  );
}
```

## 📖 Recursos

- **React Aria Docs**: https://react-spectrum.adobe.com/react-aria/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro

## 🤝 Contribuir

1. Seguir guías de estilo del proyecto
2. Agregar tests para nuevos componentes
3. Documentar props y ejemplos
4. Validar accesibilidad con axe
5. Crear PR con descripción detallada

## 📝 Changelog

Ver `CHANGELOG.md` para historial de cambios.

## 📄 Licencia

Uso interno de Intellipost.
