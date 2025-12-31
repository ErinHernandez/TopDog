/**
 * useDeviceCapabilities Hook
 * 
 * React hook for accessing device capability information.
 * Detects iOS version, screen size, and feature support for legacy device handling.
 * 
 * @example
 * ```tsx
 * const { isLegacyDevice, supportTier, supportsFlexGap } = useDeviceCapabilities();
 * 
 * // Conditionally render based on device tier
 * if (isLegacyDevice) {
 *   return <SimplifiedComponent />;
 * }
 * return <FullFeaturedComponent />;
 * ```
 * 
 * Created: December 30, 2024
 */

import { useState, useEffect, useMemo } from 'react';
import {
  type DeviceCapabilities,
  detectDeviceCapabilities,
  getDeviceCapabilities,
  applyDeviceClasses,
  getAnimationDuration,
  shouldReduceAnimations,
  getRecommendedBatchSize,
  getRecommendedDebounceDelay,
} from '../../core/utils/deviceCapabilities';

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access device capabilities
 * 
 * @param applyClasses - Whether to apply CSS classes to html element (default: false)
 * @returns Device capabilities object
 */
export function useDeviceCapabilities(applyClasses = false): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => 
    getDeviceCapabilities()
  );

  useEffect(() => {
    // Detect capabilities on mount (handles SSR -> client hydration)
    const detected = detectDeviceCapabilities();
    setCapabilities(detected);

    // Apply CSS classes if requested
    if (applyClasses) {
      applyDeviceClasses(detected);
    }

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      const updated = detectDeviceCapabilities();
      setCapabilities(updated);
      if (applyClasses) {
        applyDeviceClasses(updated);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyClasses]);

  return capabilities;
}

// ============================================================================
// DERIVED HOOKS
// ============================================================================

/**
 * Hook to check if device is legacy (Tier 2 or 3)
 */
export function useIsLegacyDevice(): boolean {
  const { isLegacyDevice } = useDeviceCapabilities();
  return isLegacyDevice;
}

/**
 * Hook to get device support tier
 */
export function useDeviceTier(): 1 | 2 | 3 {
  const { supportTier } = useDeviceCapabilities();
  return supportTier;
}

/**
 * Hook to check if animations should be reduced
 */
export function useReducedAnimations(): boolean {
  const { prefersReducedMotion, supportTier } = useDeviceCapabilities();
  return prefersReducedMotion || supportTier >= 2;
}

/**
 * Hook to get animation duration adjusted for device
 */
export function useAnimationDuration(baseDuration: number): number {
  const capabilities = useDeviceCapabilities();
  return useMemo(
    () => getAnimationDuration(baseDuration),
    [baseDuration, capabilities.prefersReducedMotion, capabilities.supportTier]
  );
}

/**
 * Hook to get recommended batch size for list rendering
 */
export function useBatchSize(): number {
  const capabilities = useDeviceCapabilities();
  return useMemo(
    () => getRecommendedBatchSize(),
    [capabilities.supportTier]
  );
}

/**
 * Hook to get recommended debounce delay
 */
export function useDebounceDelay(): number {
  const capabilities = useDeviceCapabilities();
  return useMemo(
    () => getRecommendedDebounceDelay(),
    [capabilities.supportTier]
  );
}

// ============================================================================
// UTILITY FUNCTIONS (RE-EXPORTED)
// ============================================================================

export {
  getAnimationDuration,
  shouldReduceAnimations,
  getRecommendedBatchSize,
  getRecommendedDebounceDelay,
  applyDeviceClasses,
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default useDeviceCapabilities;

