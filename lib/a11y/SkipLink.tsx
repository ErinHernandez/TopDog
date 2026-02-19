'use client';

/**
 * Idesaign — Skip to Main Content Link
 *
 * A keyboard-navigation aid that:
 * - Appears visually at the top of the page when focused
 * - Skips over header navigation to #main-content
 * - Is visually hidden until focused (progressive enhancement)
 * - Follows WAI-ARIA authoring practices
 *
 * Place this at the very top of your _app.tsx or _document.tsx
 * to make it the first focusable element.
 *
 * @module lib/a11y/SkipLink
 */

import React, { useCallback } from 'react';
import styles from './SkipLink.module.css';

/**
 * Skip link component.
 * Renders as a visually-hidden anchor that becomes visible on focus.
 *
 * Should be placed at the start of your app layout:
 * ```tsx
 * <SkipLink />
 * <header>...</header>
 * <main id="main-content">...</main>
 * ```
 *
 * @example
 * ```tsx
 * // In pages/_app.tsx or top of layout
 * export default function IdesaignApp({ Component, pageProps }: AppProps) {
 *   return (
 *     <AppErrorBoundary>
 *       <SkipLink />
 *       <AuthProvider>
 *         <Component {...pageProps} />
 *       </AuthProvider>
 *     </AppErrorBoundary>
 *   );
 * }
 * ```
 */
export function SkipLink(): React.ReactNode {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('main-content');
    if (target) {
      e.preventDefault();
      target.focus();
      // Optionally scroll to the element (browsers usually do this with anchors)
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <a href="#main-content" className={styles.skipLink} onClick={handleClick}>
      Skip to main content
    </a>
  );
}
