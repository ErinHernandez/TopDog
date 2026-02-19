/**
 * Lazy Style Loading Utilities
 *
 * Helpers for dynamically loading CSS and components to improve
 * initial bundle size and time-to-interactive.
 *
 * @example
 * ```tsx
 * // Lazy load a heavy component
 * const StatsTable = lazyComponent(() =>
 *   import('@/components/shared/StatsTable')
 * );
 *
 * // Preload styles before route change
 * preloadModuleStyles('/draft');
 * ```
 */

import dynamic from 'next/dynamic';
import type { ComponentType, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface LazyComponentOptions {
  /** Show loading fallback - function that returns a ReactNode */
  loading?: (() => ReactNode) | null;
  /** Whether to SSR the component */
  ssr?: boolean;
}

// ============================================================================
// LAZY COMPONENT LOADER
// ============================================================================

/**
 * Create a lazy-loaded component with automatic code splitting.
 *
 * @example
 * const HeavyChart = lazyComponent(
 *   () => import('@/components/charts/HeavyChart'),
 *   { ssr: false }
 * );
 */
export function lazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
): ComponentType<P> {
  const { loading = null, ssr = true } = options;

  return dynamic(importFn, {
    loading: loading ?? undefined,
    ssr,
  });
}

// ============================================================================
// ROUTE-BASED STYLE PRELOADING
// ============================================================================

/**
 * Map of routes to their critical CSS modules.
 * Used for preloading styles before navigation.
 */
const ROUTE_STYLES: Record<string, string[]> = {
  '/draft': [
    '/styles/components/stats-table.module.css',
    '/styles/utilities/positions.css',
    '/styles/utilities/teams.css',
  ],
  '/lobby': [
    '/styles/device-sizing.css',
  ],
  '/profile': [
    '/styles/utilities/positions.css',
  ],
};

/**
 * Preload CSS for an upcoming route.
 * Call this on hover or before navigation for faster perceived performance.
 *
 * @example
 * <Link href="/draft" onMouseEnter={() => preloadRouteStyles('/draft')}>
 */
export function preloadRouteStyles(route: string): void {
  const styles = ROUTE_STYLES[route];
  if (!styles) return;

  styles.forEach((href) => {
    // Check if already preloaded
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });
}

// ============================================================================
// CSS MODULES LAZY LOADING
// ============================================================================

/**
 * Dynamically import a CSS Module only when needed.
 * Returns a cleanup function to remove styles on unmount.
 *
 * @example
 * useEffect(() => {
 *   return loadStylesOnDemand('stats-table');
 * }, []);
 */
export function loadStylesOnDemand(
  moduleId: string
): () => void {
  const styleId = `lazy-style-${moduleId}`;

  // Already loaded
  if (document.getElementById(styleId)) {
    return () => {};
  }

  // Create link element
  const link = document.createElement('link');
  link.id = styleId;
  link.rel = 'stylesheet';
  link.href = `/styles/components/${moduleId}.module.css`;
  document.head.appendChild(link);

  // Cleanup function
  return () => {
    const el = document.getElementById(styleId);
    if (el) {
      el.remove();
    }
  };
}

// ============================================================================
// INTERSECTION OBSERVER LOADING
// ============================================================================

/**
 * Load styles when element becomes visible.
 * Useful for below-the-fold content.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 *
 * useEffect(() => {
 *   if (ref.current) {
 *     return loadStylesOnVisible(ref.current, 'stats-table');
 *   }
 * }, []);
 */
export function loadStylesOnVisible(
  element: HTMLElement,
  moduleId: string
): () => void {
  let cleanup = () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          cleanup = loadStylesOnDemand(moduleId);
          observer.disconnect();
        }
      });
    },
    { rootMargin: '100px' } // Load slightly before visible
  );

  observer.observe(element);

  return () => {
    observer.disconnect();
    cleanup();
  };
}

// ============================================================================
// CRITICAL CSS INJECTION
// ============================================================================

/**
 * Inject critical CSS inline for immediate render.
 * Use in _document.tsx for server-side injection.
 *
 * @example
 * // In _document.tsx
 * <Head>
 *   <style dangerouslySetInnerHTML={{ __html: getCriticalCSS() }} />
 * </Head>
 */
export function getCriticalCSSPath(): string {
  return '/styles/critical.css';
}

// ============================================================================
// EXPORTS
// ============================================================================

const lazyStylesExports = {
  lazyComponent,
  preloadRouteStyles,
  loadStylesOnDemand,
  loadStylesOnVisible,
  getCriticalCSSPath,
};

export default lazyStylesExports;
