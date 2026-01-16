/**
 * useIsMobileDevice - Detects if user is on a mobile device
 * 
 * Fixed version with:
 * - Immediate isLoaded=true on mount (no waiting)
 * - SSR-safe (works during server render)
 * - No async operations that can hang
 */

import { useState, useEffect } from 'react';

/**
 * Mobile detection breakpoint (pixels)
 * Devices with viewport width <= this value are considered mobile
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Tablet detection breakpoint (pixels)
 * Devices with viewport width between MOBILE_BREAKPOINT and this are tablets
 */
const TABLET_BREAKPOINT = 1024;

/**
 * Detects mobile device using multiple signals
 * Runs only on client side
 */
function detectMobileDevice() {
  // Server-side: return safe defaults
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isPhone: false };
  }

  const width = window.innerWidth;
  const userAgent = navigator.userAgent || '';
  
  // Check user agent for mobile indicators
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Check viewport width
  const mobileWidth = width <= MOBILE_BREAKPOINT;
  const tabletWidth = width > MOBILE_BREAKPOINT && width <= TABLET_BREAKPOINT;
  
  // Check touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Determine device type
  const isPhone = mobileWidth || (mobileUserAgent && !tabletWidth);
  const isTablet = tabletWidth || /iPad/i.test(userAgent);
  const isMobile = isPhone || isTablet || (mobileUserAgent && hasTouch);

  return { isMobile, isTablet, isPhone };
}

/**
 * Hook to detect if the current device is mobile
 * 
 * @returns Object with isMobile, isLoaded, isTablet, isPhone
 * 
 * @example
 * const { isMobile, isLoaded } = useIsMobileDevice();
 * if (!isLoaded) return <Loading />;
 * return isMobile ? <MobileView /> : <DesktopView />;
 */
export function useIsMobileDevice() {
  // CRITICAL: Always initialize with SSR-safe defaults to prevent hydration mismatch
  // On server: window is undefined, so detectMobileDevice() returns safe defaults
  // On client initial render: We MUST use the same safe defaults to match server
  // Only after mount (useEffect) do we update with actual detection
  const [state, setState] = useState(() => {
    // Always return safe defaults on initial render (both server and client)
    // This ensures server and client render the same HTML during hydration
    return {
      isMobile: false,
      isTablet: false,
      isPhone: false,
      isLoaded: false, // Will be set to true immediately on mount
    };
  });

  useEffect(() => {
    // CRITICAL: Set isLoaded to true immediately on mount
    // This ensures the loading state clears even if detection is instant
    const detected = detectMobileDevice();
    setState({
      ...detected,
      isLoaded: true, // Always true after mount
    });

    // Optional: Listen for resize events to update detection
    const handleResize = () => {
      setState(prev => ({
        ...detectMobileDevice(),
        isLoaded: true,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

// Default export for convenience
export default useIsMobileDevice;
