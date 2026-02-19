/**
 * CSS Custom Properties Type Extensions
 *
 * Extends React's CSSProperties to allow CSS custom properties (CSS variables)
 * in style props. This enables type-safe usage of CSS variables:
 *
 * @example
 * <div style={{ '--progress-value': '50%' }} />
 *
 * Without this extension, TypeScript would error on CSS custom properties.
 */
import 'react';

declare module 'react' {
  interface CSSProperties {
    /**
     * Allow any CSS custom property (--*)
     * Values can be strings (e.g., '50%', '#ff0000', '10px')
     * or numbers (will be used as-is, no unit added)
     */
    [key: `--${string}`]: string | number | undefined;
  }
}

export {};
