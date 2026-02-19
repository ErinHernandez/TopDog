/**
 * Idesaign — useMediaQuery Hook
 *
 * React hooks for responsive media queries using matchMedia API.
 * SSR-safe: returns false on server, true/false on client.
 *
 * @module hooks/useMediaQuery
 */

import { useEffect, useState } from 'react';

/**
 * Generic media query hook.
 *
 * Returns the current match state of a CSS media query.
 * Safe to use on server (returns false until hydrated).
 *
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean - true if media query matches, false otherwise
 *
 * @example
 * const isSmall = useMediaQuery('(max-width: 480px)');
 * if (isSmall) return <CompactLayout />;
 *
 * @example
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial state
    setMatches(mediaQuery.matches);

    // Create listener callback
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Use addEventListener for better compatibility
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  // Return false on server to prevent hydration mismatch
  return isMounted && matches;
}

/**
 * Check if device matches mobile breakpoint.
 *
 * Matches screens up to 768px (tablet portrait).
 *
 * @returns boolean - true if max-width: 768px
 *
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) return <MobileNavigation />;
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * Check if device matches tablet breakpoint.
 *
 * Matches screens up to 1024px (tablet landscape).
 *
 * @returns boolean - true if max-width: 1024px
 *
 * @example
 * const isTablet = useIsTablet();
 * if (isTablet) return <TabletLayout />;
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(max-width: 1024px)');
}

/**
 * Check if device matches desktop breakpoint.
 *
 * Matches screens 1025px and above (desktop).
 *
 * @returns boolean - true if min-width: 1025px
 *
 * @example
 * const isDesktop = useIsDesktop();
 * if (isDesktop) return <DesktopLayout />;
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

/**
 * Check if device matches phone breakpoint.
 *
 * Matches screens up to 480px (phone).
 *
 * @returns boolean - true if max-width: 480px
 *
 * @example
 * const isPhone = useIsPhone();
 * if (isPhone) return <PhoneLayout />;
 */
export function useIsPhone(): boolean {
  return useMediaQuery('(max-width: 480px)');
}

/**
 * Check if device matches wide desktop breakpoint.
 *
 * Matches screens 1440px and above (wide screens).
 *
 * @returns boolean - true if min-width: 1440px
 *
 * @example
 * const isWideDesktop = useIsWideDesktop();
 * if (isWideDesktop) return <FullWidthLayout />;
 */
export function useIsWideDesktop(): boolean {
  return useMediaQuery('(min-width: 1440px)');
}

/**
 * Check if user prefers reduced motion.
 *
 * Respects accessibility preferences for animations.
 *
 * @returns boolean - true if prefers-reduced-motion: reduce
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * const duration = prefersReducedMotion ? 0 : 300;
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Check if user prefers dark mode.
 *
 * Matches system dark mode preference.
 *
 * @returns boolean - true if prefers-color-scheme: dark
 *
 * @example
 * const prefersDarkMode = useDarkMode();
 * if (prefersDarkMode) applyDarkTheme();
 */
export function useDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Check if device is in portrait orientation.
 *
 * @returns boolean - true if orientation: portrait
 *
 * @example
 * const isPortrait = usePortraitMode();
 * if (isPortrait) return <PortraitLayout />;
 */
export function usePortraitMode(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

/**
 * Check if device is in landscape orientation.
 *
 * @returns boolean - true if orientation: landscape
 *
 * @example
 * const isLandscape = useLandscapeMode();
 * if (isLandscape) return <LandscapeLayout />;
 */
export function useLandscapeMode(): boolean {
  return useMediaQuery('(orientation: landscape)');
}
