/**
 * useIsMobileDevice - Detect if running on actual mobile device
 * 
 * Returns true if the user is on an actual iPhone, iPad, or Android device.
 * This is used to show fullscreen app experience on mobile instead of 
 * the phone frame preview used on desktop.
 */

import { useState, useEffect } from 'react';

export function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // iOS detection
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      
      // iPad on iOS 13+ reports as Mac, so also check for touch
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      
      // Android detection
      const isAndroid = /android/i.test(userAgent);
      
      // Also check if running as installed PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
      
      // Consider it mobile if it's a mobile device OR running as PWA
      const mobile = isIOS || isIPadOS || isAndroid || isStandalone;
      
      setIsMobile(mobile);
      setIsLoaded(true);
    };

    checkMobile();
    
    // Also listen for display mode changes (PWA install)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkMobile();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { isMobile, isLoaded };
}

export default useIsMobileDevice;

