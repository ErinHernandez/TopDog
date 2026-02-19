/**
 * useTabletOrientation - Orientation Detection Hook
 * 
 * Detects current iPad orientation and provides lock status.
 * Used by OrientationGuard to show portrait blocker.
 * 
 * @example
 * ```tsx
 * const { isLandscape, isPortrait, orientation } = useTabletOrientation();
 * 
 * if (isPortrait) {
 *   return <PortraitBlocker />;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

import type { 
  TabletOrientation, 
  UseTabletOrientationResult 
} from '../../core/types/tablet';

/**
 * Hook to detect and monitor tablet orientation
 * @returns Orientation state and utilities
 */
export function useTabletOrientation(): UseTabletOrientationResult {
  const [orientation, setOrientation] = useState<TabletOrientation>('unknown');
  const [angle, setAngle] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  
  /**
   * Detect current orientation using available APIs
   */
  const detectOrientation = useCallback((): { 
    orientation: TabletOrientation; 
    angle: number;
  } => {
    if (typeof window === 'undefined') {
      return { orientation: 'unknown', angle: 0 };
    }
    
    // Method 1: Screen Orientation API (most reliable)
    if (screen.orientation) {
      const type = screen.orientation.type;
      const orientationAngle = screen.orientation.angle;
      
      if (type.includes('landscape')) {
        return { orientation: 'landscape', angle: orientationAngle };
      } else if (type.includes('portrait')) {
        return { orientation: 'portrait', angle: orientationAngle };
      }
    }
    
    // Method 2: window.orientation (deprecated but still useful on iOS)
    if (typeof window.orientation === 'number') {
      const windowAngle = Math.abs(window.orientation);
      const isLandscape = windowAngle === 90 || windowAngle === 270;
      return { 
        orientation: isLandscape ? 'landscape' : 'portrait',
        angle: window.orientation,
      };
    }
    
    // Method 3: Window dimensions comparison (fallback)
    const isLandscape = window.innerWidth > window.innerHeight;
    return { 
      orientation: isLandscape ? 'landscape' : 'portrait',
      angle: isLandscape ? 90 : 0,
    };
  }, []);
  
  /**
   * Refresh orientation state
   */
  const refresh = useCallback(() => {
    const result = detectOrientation();
    setOrientation(result.orientation);
    setAngle(result.angle);
  }, [detectOrientation]);
  
  // Initial detection and event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initial detection
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing from browser APIs on mount
    refresh();
    
    // Check API support
    setIsSupported('orientation' in screen);
    
    // Handler for orientation changes
    const handleChange = () => {
      // Small delay to let browser update dimensions
      requestAnimationFrame(refresh);
    };
    
    // Listen to multiple events for best coverage
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleChange);
    }
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);
    
    // Also check on visibility change (handles some edge cases)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleChange();
      }
    });
    
    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleChange);
      }
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, [refresh]);
  
  return {
    orientation,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    angle,
    isSupported,
    refresh,
  };
}

export default useTabletOrientation;

