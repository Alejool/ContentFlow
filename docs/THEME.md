# Sistema de Tema - ContentFlow

Este documento describe el sistema de diseño centralizado del proyecto ContentFlow.

## 📋 Tabla de Contenidos

- [Colores](#colores)
- [Gradientes](#gradientes)
- [Tipografía](#tipografía)
- [Espaciado](#espaciado)
- [Sombras](#sombras)
- [Transiciones](#transiciones)
- [Uso del Tema](#uso-del-tema)

## 🎨 Colores

### Colores Primarios (Rojo)
```typescript
theme.colors.primary[50]  // #fef2f2 - Muy claro
theme.colors.primary[100] // #fee2e2
theme.colors.primary[500] // #ef4444
theme.colors.primary[600] // #dc2626 - Principal
theme.colors.primary[700] // #b91c1c
theme.colors.primary[900] // #7f1d1d - Muy oscuro
```

### Colores Secundarios (Naranja)
```typescript
theme.colors.secondary[50]  // #fff7ed - Muy claro
theme.colors.secondary[100] // #ffedd5
theme.colors.secondary[500] // #f97316
theme.colors.secondary[600] // #ea580c - Principal
theme.colors.secondary[700] // #c2410c
theme.colors.secondary[900] // #7c2d12 - Muy oscuro
```

### Colores de Acento

#### Azul
```typescript
theme.colors.accent.blue[50]  // #eff6ff
theme.colors.accent.blue[500] // #3b82f6
theme.colors.accent.blue[600] // #2563eb
```

#### Púrpura
```typescript
theme.colors.accent.purple[50]  // #faf5ff
theme.colors.accent.purple[500] // #a855f7
theme.colors.accent.purple[600] // #9333ea
```

#### Verde
```typescript
theme.colors.accent.green[50]  // #f0fdf4
theme.colors.accent.green[500] // #22c55e
theme.colors.accent.green[600] // #16a34a
```

### Colores Semánticos

```typescript
// Éxito
theme.colors.success[50]  // Fondo claro
theme.colors.success[500] // Principal
theme.colors.success[600] // Hover

// Error
theme.colors.error[50]  // Fondo claro
theme.colors.error[500] // Principal
theme.colors.error[600] // Hover

// Advertencia
theme.colors.warning[50]  // Fondo claro
theme.colors.warning[500] // Principal
theme.colors.warning[600] // Hover

// Información
theme.colors.info[50]  // Fondo claro
theme.colors.info[500] // Principal
theme.colors.info[600] // Hover
```

### Grises
```typescript
theme.colors.gray[50]  // #f9fafb - Muy claro
theme.colors.gray[100] // #f3f4f6
theme.colors.gray[200] // #e5e7eb
theme.colors.gray[500] // #6b7280
theme.colors.gray[700] // #374151
theme.colors.gray[900] // #111827 - Muy oscuro
```

## 🌈 Gradientes

```typescript
// Gradiente principal (rojo a naranja)
theme.gradients.primary // 'linear-gradient(to right, #dc2626, #ea580c)'

// Gradiente principal hover
theme.gradients.primaryHover // 'linear-gradient(to right, #b91c1c, #c2410c)'

// Gradiente secundario (naranja a rojo)
theme.gradients.secondary // 'linear-gradient(to right, #ea580c, #dc2626)'

// Gradiente de acento (azul a púrpura)
theme.gradients.accent // 'linear-gradient(to right, #3b82f6, #9333ea)'

// Gradiente claro
theme.gradients.light // 'linear-gradient(to right, #eff6ff, #faf5ff)'

// Gradiente cálido
theme.gradients.warm // 'linear-gradient(to right, #f9fafb, #ffffff, #fef2f2)'
```

## ✍️ Tipografía

### Familias de Fuentes
```typescript
theme.typography.fontFamily.sans // Sistema de fuentes sans-serif
theme.typography.fontFamily.mono // Fuentes monoespaciadas
```

### Tamaños de Fuente
```typescript
theme.typography.fontSize.xs    // 0.75rem (12px)
theme.typography.fontSize.sm    // 0.875rem (14px)
theme.typography.fontSize.base  // 1rem (16px)
theme.typography.fontSize.lg    // 1.125rem (18px)
theme.typography.fontSize.xl    // 1.25rem (20px)
theme.typography.fontSize['2xl'] // 1.5rem (24px)
theme.typography.fontSize['3xl'] // 1.875rem (30px)
theme.typography.fontSize['4xl'] // 2.25rem (36px)
theme.typography.fontSize['5xl'] // 3rem (48px)
```

### Pesos de Fuente
```typescript
theme.typography.fontWeight.normal    // 400
theme.typography.fontWeight.medium    // 500
theme.typography.fontWeight.semibold  // 600
theme.typography.fontWeight.bold      // 700
theme.typography.fontWeight.extrabold // 800
```

### Altura de Línea
```typescript
theme.typography.lineHeight.none     // 1
theme.typography.lineHeight.tight    // 1.25
theme.typography.lineHeight.normal   // 1.5
theme.typography.lineHeight.relaxed  // 1.625
theme.typography.lineHeight.loose    // 2
```

## 📏 Espaciado

```typescript
theme.spacing[0]  // 0
theme.spacing[1]  // 0.25rem (4px)
theme.spacing[2]  // 0.5rem (8px)
theme.spacing[3]  // 0.75rem (12px)
theme.spacing[4]  // 1rem (16px)
theme.spacing[6]  // 1.5rem (24px)
theme.spacing[8]  // 2rem (32px)
theme.spacing[12] // 3rem (48px)
theme.spacing[16] // 4rem (64px)
```

## 🔲 Border Radius

```typescript
theme.borderRadius.none  // 0
theme.borderRadius.sm    // 0.125rem (2px)
theme.borderRadius.base  // 0.25rem (4px)
theme.borderRadius.md    // 0.375rem (6px)
theme.borderRadius.lg    // 0.5rem (8px)
theme.borderRadius.xl    // 0.75rem (12px)
theme.borderRadius['2xl'] // 1rem (16px)
theme.borderRadius['3xl'] // 1.5rem (24px)
theme.borderRadius.full  // 9999px (círculo)
```

## 🌑 Sombras

```typescript
theme.shadows.sm    // Sombra pequeña
theme.shadows.base  // Sombra base
theme.shadows.md    // Sombra mediana
theme.shadows.lg    // Sombra grande
theme.shadows.xl    // Sombra extra grande
theme.shadows['2xl'] // Sombra muy grande
theme.shadows.inner // Sombra interna
theme.shadows.none  // Sin sombra
```

## ⚡ Transiciones

```typescript
theme.transitions.fast   // 150ms - Transiciones rápidas
theme.transitions.base   // 200ms - Transiciones normales
theme.transitions.slow   // 300ms - Transiciones lentas
theme.transitions.slower // 500ms - Transiciones muy lentas
```

## 📱 Breakpoints

```typescript
theme.breakpoints.sm   // 640px
theme.breakpoints.md   // 768px
theme.breakpoints.lg   // 1024px
theme.breakpoints.xl   // 1280px
theme.breakpoints['2xl'] // 1536px
```

## 🔧 Uso del Tema

### Importar el tema

```typescript
import { theme } from '@/theme';
// o
import theme from '@/theme';
```

### Usar colores

```typescript
// En componentes React
<div style={{ backgroundColor: theme.colors.primary[600] }}>
  Contenido
</div>

// Con Chakra UI
<Box bg={theme.colors.primary[600]}>
  Contenido
</Box>
```

### Usar gradientes

```typescript
// Con helper function
import { getGradient } from '@/theme';

<div style={{ background: getGradient('primary') }}>
  Contenido con gradiente
</div>

// Directamente
<div style={{ background: theme.gradients.primary }}>
  Contenido con gradiente
</div>
```

### Usar con Tailwind CSS

El tema está diseñado para complementar Tailwind CSS. Puedes usar las clases de Tailwind normalmente:

```jsx
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Botón
</button>
```

### Ejemplos Comunes

#### Botón Principal
```jsx
<button 
  style={{ 
    background: theme.gradients.primary,
    color: theme.colors.white,
    padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
    borderRadius: theme.borderRadius['2xl'],
    boxShadow: theme.shadows.lg,
    transition: theme.transitions.base,
  }}
>
  Botón Principal
</button>
```

#### Card con Sombra
```jsx
<div
  style={{
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius['2xl'],
    boxShadow: theme.shadows.md,
    padding: theme.spacing[6],
  }}
>
  Contenido del card
</div>
```

#### Texto con Gradiente
```jsx
<h1
  style={{
    background: theme.gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.extrabold,
  }}
>
  Título con Gradiente
</h1>
```

## 🎯 Mejores Prácticas

1. **Consistencia**: Usa siempre los valores del tema en lugar de valores hardcodeados
2. **Semántica**: Usa colores semánticos (`success`, `error`, `warning`, `info`) para estados
3. **Gradientes**: Usa los gradientes predefinidos para mantener consistencia visual
4. **Espaciado**: Usa la escala de espaciado para mantener ritmo visual consistente
5. **Transiciones**: Usa las duraciones predefinidas para animaciones consistentes

## 📝 Notas

- Todos los colores siguen la paleta de Tailwind CSS para compatibilidad
- Los gradientes están optimizados para la identidad visual de ContentFlow
- El tema es type-safe gracias a TypeScript
- Usa las funciones helper `getGradient()` y `getColor()` para acceso dinámico
