/**
 * Device Utilities - Simple Device Detection
 * 
 * Simple device detection utilities.
 * For more advanced capabilities, use components/vx2/hooks/ui/useDeviceCapabilities
 * 
 * Usage:
 *   import { isMobile, isIOS, isAndroid } from '../lib/deviceUtils';
 */

// ============================================================================
// BASIC DETECTION
// ============================================================================

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as { MSStream?: unknown }).MSStream;
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOSDevice = isIOS();
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAndroidDevice = isAndroid();
  return isIOSDevice || isIPadOS || isAndroidDevice;
}

/**
 * Check if running on tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
}

/**
 * Get mobile platform
 */
export function getMobilePlatform(): 'ios' | 'android' | 'other' {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'other';
}

/**
 * Get device category
 */
export function getDeviceCategory(): 'phone' | 'phablet' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'phone';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Check if device supports hover
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Get safe area insets (for notched devices)
 */
export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
  };
}

/**
 * Get mobile route (legacy function, kept for compatibility)
 */
export function getMobileRoute(path: string): string {
  return path;
}

/**
 * Get touch capabilities
 */
export function getTouchCapabilities(): { touch: boolean; pointer: boolean } {
  if (typeof window === 'undefined') {
    return { touch: false, pointer: false };
  }
  return {
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pointer: 'PointerEvent' in window,
  };
}

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceDetection {
  isMobile: boolean;
  isTablet: boolean;
  category: 'phone' | 'phablet' | 'tablet' | 'desktop';
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * React hook for responsive device detection
 * Updates when window is resized
 */
import { useState, useEffect } from 'react';

export function useDeviceDetection(): DeviceDetection {
  const [device, setDevice] = useState<DeviceDetection>({
    isMobile: false,
    isTablet: false,
    category: 'desktop'
  });

  useEffect(() => {
    const updateDevice = () => {
      setDevice({
        isMobile: isMobile(),
        isTablet: isTablet(),
        category: getDeviceCategory() as DeviceDetection['category']
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

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Check if code is running on server (SSR)
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if code is running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}
