# ContentFlow - Sistema de Diseño

## 🎨 Resumen

ContentFlow utiliza un sistema de diseño centralizado que unifica todos los colores, tipografía, espaciado y otros tokens de diseño en un solo lugar: `resources/js/theme.ts`.

## 📁 Estructura del Tema

```
resources/js/
├── theme.ts          # Configuración principal del tema
└── ...
```

## 🚀 Inicio Rápido

### 1. Importar el Tema

```typescript
import { theme } from '@/theme';
// o usar el export default
import theme from '@/theme';
```

### 2. Usar Colores

```jsx
// Método 1: Directamente en estilos inline
<div style={{ backgroundColor: theme.colors.primary[600] }}>
  Contenido
</div>

// Método 2: Con Chakra UI
<Box bg={theme.colors.primary[600]}>
  Contenido
</Box>

// Método 3: Con Tailwind CSS (recomendado)
<div className="bg-primary-600">
  Contenido
</div>
```

### 3. Usar Gradientes

```jsx
import { getGradient } from '@/theme';

// Método 1: Con helper function
<div style={{ background: getGradient('primary') }}>
  Gradiente
</div>

// Método 2: Directamente
<div style={{ background: theme.gradients.primary }}>
  Gradiente
</div>

// Método 3: Con Tailwind CSS
<div className="bg-gradient-to-r from-primary-600 to-primary-600">
  Gradiente
</div>
```

## 🎯 Paleta de Colores Principal

### Colores de Marca

| Color | Uso | Hex |
|-------|-----|-----|
| `primary[600]` | Color principal | `#dc2626` |
| `secondary[600]` | Color secundario | `#ea580c` |
| `primary[700]` | Hover principal | `#b91c1c` |
| `secondary[700]` | Hover secundario | `#c2410c` |

### Gradientes Principales

| Gradiente | Uso | Colores |
|-----------|-----|---------|
| `primary` | Botones principales | Red 600 → Orange 600 |
| `primaryHover` | Hover de botones | Red 700 → Orange 700 |
| `accent` | Elementos destacados | Blue 500 → Purple 600 |
| `light` | Fondos suaves | Blue 50 → Purple 50 |

## 📊 Tokens de Diseño

### Espaciado
```typescript
theme.spacing[4]  // 1rem (16px) - Espaciado base
theme.spacing[6]  // 1.5rem (24px) - Espaciado mediano
theme.spacing[8]  // 2rem (32px) - Espaciado grande
```

### Tipografía
```typescript
theme.typography.fontSize.base  // 1rem (16px)
theme.typography.fontSize.lg    // 1.125rem (18px)
theme.typography.fontSize['2xl'] // 1.5rem (24px)
```

### Sombras
```typescript
theme.shadows.sm   // Sombra pequeña
theme.shadows.md   // Sombra mediana
theme.shadows.lg   // Sombra grande
```

### Border Radius
```typescript
theme.borderRadius.lg    // 0.5rem (8px)
theme.borderRadius.xl    // 0.75rem (12px)
theme.borderRadius['2xl'] // 1rem (16px)
```

## 🔧 Funciones Helper

### getGradient()
Obtiene un gradiente predefinido por su nombre.

```typescript
import { getGradient } from '@/theme';

const gradient = getGradient('primary');
// Returns: 'linear-gradient(to right, #dc2626, #ea580c)'
```

### getColor()
Obtiene un color usando notación de punto.

```typescript
import { getColor } from '@/theme';

const color = getColor('primary.600');
// Returns: '#dc2626'
```

## 🎨 Ejemplos de Componentes

### Botón Principal

```jsx
<button 
  className="bg-gradient-to-r from-primary-600 to-primary-600 
             hover:from-primary-700 hover:to-primary-700 
             text-white px-6 py-3 rounded-lg 
             shadow-lg hover:shadow-xl 
             transition-all duration-200"
>
  Botón Principal
</button>
```

### Card

```jsx
<div 
  className="bg-white rounded-lg shadow-md 
             hover:shadow-lg transition-shadow 
             p-6 border border-gray-200"
>
  Contenido del Card
</div>
```

### Input con Estado de Error

```jsx
<input
  className={`w-full px-4 py-3 rounded-lg 
              border transition-all duration-300
              ${error 
                ? 'border-primary-300 bg-primary-50 focus:ring-primary-200' 
                : 'border-gray-300 bg-white focus:ring-blue-200'
              }`}
/>
```

## 📱 Responsive Design

Usa los breakpoints del tema para diseño responsive:

```jsx
// Con Tailwind CSS
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* Contenido */}
</div>

// Con media queries
@media (min-width: ${theme.breakpoints.md}) {
  /* Estilos para tablet y desktop */
}
```

## 🎯 Mejores Prácticas

### ✅ Hacer

- Usar valores del tema en lugar de colores hardcodeados
- Usar clases de Tailwind CSS cuando sea posible
- Usar colores semánticos para estados (`success`, `error`, `warning`, `info`)
- Mantener consistencia en espaciado usando la escala del tema
- Usar gradientes predefinidos para elementos destacados

### ❌ Evitar

- Hardcodear colores: `#dc2626` ❌ → `theme.colors.primary[600]` ✅
- Hardcodear espaciado: `padding: 16px` ❌ → `p-4` ✅
- Crear gradientes custom sin documentar
- Usar valores de espaciado arbitrarios
- Mezclar diferentes sistemas de colores

## 🔄 Migración de Código Existente

Si encuentras código con colores hardcodeados, reemplázalos así:

```jsx
// Antes ❌
<div className="bg-primary-600">

// Después ✅
<div className="bg-primary-600"> // Tailwind CSS
// o
<div style={{ backgroundColor: theme.colors.primary[600] }}>
```

## 📚 Recursos Adicionales

- [Documentación Completa del Tema](./THEME.md)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Chakra UI Documentation](https://chakra-ui.com/docs)

## 🤝 Contribuir

Al agregar nuevos componentes o estilos:

1. Verifica si el color/estilo ya existe en el tema
2. Si necesitas un nuevo color, agrégalo al `theme.ts`
3. Documenta el uso en `THEME.md`
4. Usa nomenclatura consistente con el resto del tema

## 📝 Notas de Versión

### v1.0.0 (Actual)
- ✅ Sistema de colores completo
- ✅ Gradientes predefinidos
- ✅ Tipografía estandarizada
- ✅ Espaciado consistente
- ✅ Sombras y transiciones
- ✅ Funciones helper
- ✅ Type-safe con TypeScript
