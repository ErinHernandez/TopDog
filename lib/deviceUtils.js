/**
 * Device Utilities - Centralized Device Detection
 * 
 * Re-exports device detection utilities from the mobile shared folder
 * for easier access across the application.
 * 
 * Usage:
 *   import { isMobile, isIOS, isAndroid } from '../lib/deviceUtils';
 */

export {
  isIOS,
  isAndroid,
  isMobile,
  isTablet,
  getMobilePlatform,
  getDeviceCategory,
  supportsHover,
  getSafeAreaInsets,
  getMobileRoute,
  getTouchCapabilities
} from '../components/draft/v3/mobile/shared/utils/deviceDetection';

/**
 * React hook for responsive device detection
 * Updates when window is resized
 */
import { useState, useEffect } from 'react';
import { isMobile as checkIsMobile, isTablet as checkIsTablet, getDeviceCategory as getCategory } from '../components/draft/v3/mobile/shared/utils/deviceDetection';

export function useDeviceDetection() {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    category: 'desktop'
  });

  useEffect(() => {
    const updateDevice = () => {
      setDevice({
        isMobile: checkIsMobile(),
        isTablet: checkIsTablet(),
        category: getCategory()
      });
    };

    // Initial check
    updateDevice();

    // Listen for resize
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  return device;
}

/**
 * Check if code is running on server (SSR)
 */
export function isServer() {
  return typeof window === 'undefined';
}

/**
 * Check if code is running on client
 */
export function isClient() {
  return typeof window !== 'undefined';
}

