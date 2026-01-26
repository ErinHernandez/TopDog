/**
 * useStableViewportHeight
 * 
 * Sets a CSS custom property (--stable-vh) that represents 1% of the
 * "stable" viewport height. This height only changes on:
 * - Initial page load
 * - Orientation change
 * - Significant resize (>100px, e.g., desktop window resize)
 * 
 * It does NOT change when:
 * - Mobile address bar shows/hides
 * - Mobile keyboard appears
 * - User scrolls
 * 
 * Usage in CSS:
 *   height: calc(var(--stable-vh, 1vh) * 100);
 * 
 * This replaces `100vh` which is unstable on mobile browsers.
 */

import { useEffect, useRef } from 'react';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[useStableViewportHeight]');

// Minimum height change (in pixels) to trigger an update
// This prevents updates from address bar (typically 50-70px)
// Set to very high value to prevent updates from DevTools/panels
// Only orientation changes will trigger updates (handled separately)
const SIGNIFICANT_CHANGE_THRESHOLD = 500;

// Debounce delay in milliseconds
const DEBOUNCE_MS = 150;

export function useStableViewportHeight(): void {
  const lastHeightRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setVhProperty = (height: number) => {
      const vh = height * 0.01;
      document.documentElement.style.setProperty('--stable-vh', `${vh}px`);
      lastHeightRef.current = height;
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Set --stable-vh to ${vh}px from height ${height}`);
      }
    };

    const getViewportHeight = (): number => {
      // Prefer visualViewport for accuracy on mobile
      if (window.visualViewport) {
        return window.visualViewport.height;
      }
      return window.innerHeight;
    };

    const handleResize = () => {
      const currentHeight = getViewportHeight();

      // On first load, always set
      if (!isInitializedRef.current) {
        setVhProperty(currentHeight);
        isInitializedRef.current = true;
        return;
      }

      // After initialization, don't update on resize events
      // Only orientation changes will trigger updates (handled separately)
      // This prevents updates when DevTools opens/closes or browser UI changes
    };

    const handleOrientationChange = () => {
      // Always update on orientation change, with small delay for browser to settle
      setTimeout(() => {
        const currentHeight = getViewportHeight();
        setVhProperty(currentHeight);
      }, 100);
    };

    // Initialize immediately
    handleResize();

    // Listen for resize events
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Always listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
}

/**
 * CSS helper - use in your stylesheets:
 * 
 * .full-height {
 *   height: 100vh; // Fallback for SSR
 *   height: calc(var(--stable-vh, 1vh) * 100);
 * }
 * 
 * .half-height {
 *   height: 50vh;
 *   height: calc(var(--stable-vh, 1vh) * 50);
 * }
 */
