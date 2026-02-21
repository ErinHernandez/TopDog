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
  // Initialize with SSR-safe defaults to prevent hydration mismatch
  // Always use defaults on initial render (both server and client) to ensure hydration match
  // Will be updated in useEffect on client-side after mount
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => {
    // Always return SSR-safe defaults on initial render to prevent hydration mismatch
    return {
      iosVersion: null,
      safariVersion: null,
      isLegacyDevice: false,
      supportTier: 1,
      supportsFlexGap: true,
      supportsAspectRatio: true,
      supportsWebP: true,
      prefersReducedMotion: false,
      screenWidth: 390,
      screenHeight: 844,
      devicePixelRatio: 3,
      hasNotchOrIsland: true,
      estimatedModel: 'iPhone 14 Pro',
    };
  });

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
  useDeviceCapabilities(); // Read for side effects only
  return useMemo(() => getAnimationDuration(baseDuration), [baseDuration]);
}

/**
 * Hook to get recommended batch size for list rendering
 */
export function useBatchSize(): number {
  useDeviceCapabilities(); // Read for side effects only
  return useMemo(() => getRecommendedBatchSize(), []);
}

/**
 * Hook to get recommended debounce delay
 */
export function useDebounceDelay(): number {
  useDeviceCapabilities(); // Read for side effects only
  return useMemo(() => getRecommendedDebounceDelay(), []);
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
