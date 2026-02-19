/**
 * Idesaign — Accessibility Utilities & Components
 *
 * Barrel export of all a11y utilities and components for convenient importing:
 *
 * @example
 * ```tsx
 * import { AriaLive, FocusTrap, SkipLink, KeyboardShortcuts } from '@/lib/a11y';
 * ```
 *
 * @module lib/a11y
 */

export { AriaLive, AriaLiveProvider, useAnnounce } from './AriaLive';
export type { AriaLiveProps } from './AriaLive';

export { FocusTrap } from './FocusTrap';
export type { FocusTrapProps } from './FocusTrap';

export { SkipLink } from './SkipLink';

export { KeyboardShortcuts, DEFAULT_SHORTCUTS } from './KeyboardShortcuts';
export type {
  KeyboardShortcutsProps,
  Shortcut,
  ShortcutGroup,
} from './KeyboardShortcuts';
