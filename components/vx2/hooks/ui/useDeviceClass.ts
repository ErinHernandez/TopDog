/**
 * useDeviceClass Hook
 * 
 * Provides reactive device classification based on viewport height.
 * Used for responsive component rendering across iPhone models.
 * 
 * @example
 * ```tsx
 * const deviceClass = useDeviceClass();
 * const scale = RESPONSIVE_SCALE[deviceClass];
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  DeviceClass, 
  getDeviceClass, 
  getResponsiveScale,
  getResponsiveCSSVars,
  ResponsiveScale,
} from '../../core/constants/responsive';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[useDeviceClass]');

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Returns the current device class based on viewport height
 * Updates on window resize with debouncing for performance
 */
export function useDeviceClass(): DeviceClass {
  const [deviceClass, setDeviceClass] = useState<DeviceClass>('standard');
  
  useEffect(() => {
    // Initial check
    const updateClass = () => {
      const height = window.innerHeight;
      const newClass = getDeviceClass(height);
      setDeviceClass(newClass);
    };
    
    updateClass();
    
    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateClass, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);
  
  return deviceClass;
}

// ============================================================================
// EXTENDED HOOKS
// ============================================================================

/**
 * Returns the responsive scale values for the current device class
 */
export function useResponsiveScale(): ResponsiveScale {
  const deviceClass = useDeviceClass();
  return getResponsiveScale(deviceClass);
}

/**
 * Returns CSS custom properties for the current device class
 * Can be spread into a style prop
 */
export function useResponsiveCSSVars(): Record<string, string> {
  const deviceClass = useDeviceClass();
  return getResponsiveCSSVars(deviceClass);
}

/**
 * Returns both device class and scale for convenience
 */
export function useDeviceResponsive(): {
  deviceClass: DeviceClass;
  scale: ResponsiveScale;
  isCompact: boolean;
  isStandard: boolean;
  isLarge: boolean;
} {
  const deviceClass = useDeviceClass();
  const scale = getResponsiveScale(deviceClass);
  
  return {
    deviceClass,
    scale,
    isCompact: deviceClass === 'compact',
    isStandard: deviceClass === 'standard',
    isLarge: deviceClass === 'large',
  };
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Hook for development: logs device class changes and content fit issues
 */
export function useDeviceClassDebug(componentName: string): DeviceClass {
  const deviceClass = useDeviceClass();
  
  useEffect(() => {
    logger.debug(`[${componentName}] Device class: ${deviceClass}`, { 
      height: window.innerHeight 
    });
  }, [deviceClass, componentName]);
  
  return deviceClass;
}

export default useDeviceClass;


