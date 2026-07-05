/**
 * Re-export of the Design System Button so `@/Components/ui/button` and
 * `@/Components/ui/system` resolve to the same canonical component.
 * New code should prefer importing from `@/Components/ui/system`.
 */
export { Button, type ButtonProps } from './system/Button';
