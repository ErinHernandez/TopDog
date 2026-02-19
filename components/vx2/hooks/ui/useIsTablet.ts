/**
 * useIsTablet - Tablet Device Detection Hook
 * 
 * Detects if the device is a tablet, specifically an iPad.
 * Provides model detection and device capabilities.
 * 
 * @example
 * ```tsx
 * const { isTablet, isIPad, model, isLoaded } = useIsTablet();
 * 
 * if (!isLoaded) return <Loading />;
 * if (!isTablet) return <MobileView />;
 * return <TabletView />;
 * ```
 */

import { useState, useEffect, useMemo } from 'react';

import { TABLET_BREAKPOINTS } from '../../core/constants/tablet';
import type { 
  iPadModel, 
  TabletDeviceInfo,
  UseIsTabletResult,
  TabletOrientation,
} from '../../core/types/tablet';

/**
 * Detect iPad model based on screen dimensions
 */
function detectIPadModel(): iPadModel {
  if (typeof window === 'undefined') return 'not-ipad';
  
  const width = window.screen.width;
  const height = window.screen.height;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);
  
  // Check for iPad user agent first
  const userAgent = navigator.userAgent;
  const isIPadUA = /iPad/.test(userAgent);
  
  // iPad on iOS 13+ reports as Mac with touch
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  
  if (!isIPadUA && !isIPadOS) {
    // Check if dimensions match any iPad
    const possibleIPad = (
      (maxDim >= 1024 && maxDim <= 1366) && 
      (minDim >= 744 && minDim <= 1024)
    );
    
    if (!possibleIPad) return 'not-ipad';
  }
  
  // Model detection based on screen dimensions
  // Note: These are logical pixels, not physical
  if (maxDim === 1366 && minDim === 1024) {
    return 'ipad-pro-12.9';
  }
  if (maxDim === 1194 && minDim === 834) {
    return 'ipad-pro-11';
  }
  if ((maxDim === 1180 || maxDim === 1194) && (minDim === 820 || minDim === 834)) {
    return 'ipad-air';
  }
  if (maxDim === 1133 && minDim === 744) {
    return 'ipad-mini';
  }
  if (maxDim === 1080 && minDim === 810) {
    return 'ipad-9th';
  }
  if ((maxDim >= 1024 && maxDim <= 1366) && (minDim >= 744 && minDim <= 1024)) {
    return 'ipad-unknown';
  }
  
  return 'not-ipad';
}

/**
 * Detect if device has rounded corners (affects safe areas)
 */
function hasNotch(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Modern iPads with Face ID or no home button have rounded corners
  const model = detectIPadModel();
  return ['ipad-pro-12.9', 'ipad-pro-11', 'ipad-air', 'ipad-mini', 'ipad-10th'].includes(model);
}

/**
 * Detect pointer capabilities
 */
function detectPointerCapabilities(): { hasPointer: boolean; hasHover: boolean } {
  if (typeof window === 'undefined') {
    return { hasPointer: false, hasHover: false };
  }
  
  const hasPointer = window.matchMedia('(pointer: fine)').matches;
  const hasHover = window.matchMedia('(hover: hover)').matches;
  
  return { hasPointer, hasHover };
}

/**
 * Get current orientation
 */
function getCurrentOrientation(): TabletOrientation {
  if (typeof window === 'undefined') return 'unknown';
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * Hook to detect tablet/iPad device
 * @returns Tablet detection results
 */
export function useIsTablet(): UseIsTabletResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [model, setModel] = useState<iPadModel>('not-ipad');
  const [deviceInfo, setDeviceInfo] = useState<TabletDeviceInfo | null>(null);
  
  useEffect(() => {
    // Only run on client-side to prevent hydration mismatches
    if (typeof window === 'undefined') {
      return;
    }
    
    const detectDevice = () => {
      const detectedModel = detectIPadModel();
      const pointerCaps = detectPointerCapabilities();
      
      const info: TabletDeviceInfo = {
        isIPad: detectedModel !== 'not-ipad',
        model: detectedModel,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          pixelRatio: window.devicePixelRatio,
        },
        orientation: getCurrentOrientation(),
        hasNotch: hasNotch(),
        hasPointer: pointerCaps.hasPointer,
        hasHover: pointerCaps.hasHover,
      };
      
      setModel(detectedModel);
      setDeviceInfo(info);
      setIsLoaded(true);
    };
    
    detectDevice();
    
    // Re-detect on resize (handles external display changes)
    const handleResize = () => {
      detectDevice();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Memoize derived values
  const isTablet = useMemo(() => {
    if (!isLoaded || !deviceInfo) return false;
    
    // iPad is always a tablet
    if (deviceInfo.isIPad) return true;
    
    // Check screen dimensions for other tablets
    const { width, height } = deviceInfo.screen;
    const maxDim = Math.max(width, height);
    const minDim = Math.min(width, height);
    
    return (
      minDim >= TABLET_BREAKPOINTS.MINI && 
      maxDim <= TABLET_BREAKPOINTS.MAX_WIDTH
    );
  }, [isLoaded, deviceInfo]);
  
  const isIPad = useMemo(() => {
    return model !== 'not-ipad';
  }, [model]);
  
  return {
    isTablet,
    isIPad,
    model,
    isLoaded,
    deviceInfo,
  };
}

export default useIsTablet;

