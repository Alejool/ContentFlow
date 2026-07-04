# Design System — `@/Components/ui/system`

A single, coherent foundation for every UI component. Same visual language, same
prop vocabulary, same level of configuration across the board — the quality bar
of Radix UI / shadcn / Mantine.

## Why this exists

Before this, form controls disagreed: `Button` used `size`, `Input` used
`sizeType`; `variant` meant *color* on `Button` but *visual style* on `Input`;
only `Button` had `radius`; icons worked differently everywhere. This system
gives every component **one shared prop language** and **one shared token
source**, so components feel like one product and a rebrand touches tokens only.

## The layers

```
system/
├── variants.ts     ← cva-style engine (createVariants) on top of `cn`
├── tokens.ts       ← geometry: size → height/padding/text, radius, icon size, gap
├── tone.ts         ← color: tone × appearance class maps (reads @theme tokens)
├── types.ts        ← the shared vocabulary (Size, Tone, Appearance, Radius, …)
├── Icon.tsx        ← renderIcon(): accept a component OR a node, size it right
├── FieldShell.tsx  ← shared label + hint + error/success + icon chrome for fields
└── <Primitive>.tsx ← Button, Input, Textarea, Select, Checkbox, Badge…
```

**Base primitives** (Button, Input…) compose the foundation. **Composed
components** (DatePicker, PhoneInput…) compose the base primitives. Reuse flows
downward; nothing reaches around the layer below.

## The shared vocabulary

Every component understands these words (only the ones that make sense for it):

| Prop | Type | Meaning |
|---|---|---|
| `size` | `xs \| sm \| md \| lg \| xl` | one dimensional ladder for the whole system |
| `tone` | `primary \| secondary \| neutral \| success \| warning \| danger \| info` | semantic color intent (never raw hex) |
| `appearance` | `solid \| soft \| outline \| ghost \| link` | visual weight, orthogonal to `tone` |
| `radius` | `none \| sm \| md \| lg \| xl \| 2xl \| full` | corner rounding |
| `disabled` / `loading` | `boolean` | interactive states |
| `error` / `success` / `hint` | `string` | field status + helper text |
| `leftIcon` / `rightIcon` / `iconOnly` | `IconLike` | icon slots — a component *or* a node |
| `fullWidth` | `boolean` | stretch to container |

`tone` and `appearance` are **separate axes** (unlike the old `variant` +
`buttonStyle`). A red outline button is `<Button tone="danger" appearance="outline">`.

## Usage

```tsx
import { Button, Input, Textarea, Select, Badge } from '@/Components/ui/system';
import { Search, Send } from 'lucide-react';

<Button tone="primary" appearance="solid" size="md" leftIcon={Send} loading>
  Publish
</Button>

<Button iconOnly={Search} appearance="ghost" tone="neutral" size="sm" aria-label="Search" />

<Input
  label="Email" required size="md" radius="md"
  leftIcon={Search} placeholder="you@company.com"
  error={errors.email?.message}
/>

<Input label="Password" passwordToggle />        {/* built-in show/hide */}

<Textarea label="Bio" showCount maxLength={280} rows={4} />

<Select label="Plan" options={[{ value: 'pro', label: 'Pro' }]} placeholder="Choose…" />

<Badge tone="success" appearance="soft" dot>Published</Badge>
```

Icons are uniform everywhere: pass a Lucide component (`leftIcon={Search}`) or a
node (`leftIcon={<Search className="text-primary-500" />}`) — `renderIcon`
handles both and sizes them to the control.

## Theming / rebranding

All color comes from the `@theme` block in `resources/css/app.css`
(`--color-primary-*`, `--color-success-*`, …). Change those scales and **every**
component recolors — no component code changes. `tone.ts` only references those
tokens; geometry lives in `tokens.ts`. To ship a second brand, swap the token
values (or scope them under `[data-theme="brandB"]`).

## Adding a new component (contribution rules)

1. Import geometry from `tokens.ts` and color from `tone.ts` — **never** write
   `h-10`, `text-sm` or `bg-primary-600` directly.
2. Accept the shared props from `types.ts` that make sense (at minimum `size`,
   `className`; add `tone`/`appearance`/`radius`/icons where relevant).
3. Form controls wrap their control in `<FieldShell>` so they inherit the same
   label/hint/error/icon chrome for free.
4. Use `renderIcon` for any icon slot.
5. Export from `index.ts`.

Follow those and any new component is automatically consistent with the system.

## Migration note

The legacy set in `Components/common/Modern/*` (108+ `Button` imports) keeps
working untouched. New code should import from `@/Components/ui/system`. Migrate
call sites incrementally — both can coexist during the transition.
