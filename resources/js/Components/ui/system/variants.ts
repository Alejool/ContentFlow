/**
 * variants.ts — minimal cva-style variant resolver built on `cn`.
 *
 * The project has no class-variance-authority dependency, only clsx +
 * tailwind-merge (exposed as `cn`). This gives every Design System component
 * the same declarative variant engine so their APIs stay identical:
 *
 *   const button = createVariants({
 *     base: 'inline-flex items-center',
 *     variants: {
 *       size: { sm: 'h-8', md: 'h-10' },
 *       tone: { primary: 'bg-primary-600', danger: 'bg-error-600' },
 *     },
 *     defaultVariants: { size: 'md', tone: 'primary' },
 *   });
 *
 *   button({ size: 'sm', class: 'w-full' }); // → merged className string
 */
import { cn } from '@/lib/common/utils';
import type { ClassValue } from 'clsx';

type VariantShape = Record<string, Record<string, ClassValue>>;

type VariantSelection<V extends VariantShape> = {
  [K in keyof V]?: keyof V[K] | null | undefined;
};

type CompoundVariant<V extends VariantShape> = VariantSelection<V> & {
  class: ClassValue;
};

export interface VariantConfig<V extends VariantShape> {
  /** Always-applied classes. */
  base?: ClassValue;
  /** Named axes → option → classes. */
  variants?: V;
  /** Classes applied when several axes match simultaneously. */
  compoundVariants?: CompoundVariant<V>[];
  /** Fallback option per axis when a prop is omitted. */
  defaultVariants?: VariantSelection<V>;
}

export type VariantProps<T> = T extends (props: infer P) => string
  ? Omit<P, 'class' | 'className'>
  : never;

/**
 * Build a resolver function from a variant config. The returned function
 * accepts the selected variants plus an optional `class`/`className` override
 * (merged last so callers always win).
 */
export function createVariants<V extends VariantShape>(config: VariantConfig<V>) {
  const { base, variants, compoundVariants, defaultVariants } = config;

  return (
    props: VariantSelection<V> & { class?: ClassValue; className?: ClassValue } = {},
  ): string => {
    const classes: ClassValue[] = [base];

    if (variants) {
      for (const axis in variants) {
        const selected = props[axis] ?? defaultVariants?.[axis];
        if (selected == null) continue;
        const option = variants[axis]?.[selected as string];
        if (option) classes.push(option);
      }
    }

    if (compoundVariants) {
      for (const compound of compoundVariants) {
        const { class: compoundClass, ...conditions } = compound;
        const matches = Object.entries(conditions).every(([axis, value]) => {
          const selected = props[axis as keyof V] ?? defaultVariants?.[axis as keyof V];
          return selected === value;
        });
        if (matches) classes.push(compoundClass);
      }
    }

    return cn(...classes, props.class, props.className);
  };
}
