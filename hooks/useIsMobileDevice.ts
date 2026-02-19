/**
 * Hydration-safe mobile device detection.
 * Returns `null` during SSR/initial render, then actual value after mount.
 * This prevents hydration mismatch between server and client.
 */

import { useState, useEffect } from 'react';

export function useIsMobileDevice(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isNarrowScreen = window.innerWidth < 768;
      return mobileRegex.test(userAgent) || isNarrowScreen;
    };

    // Set immediately after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
    setIsMobile(checkMobile());

    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
