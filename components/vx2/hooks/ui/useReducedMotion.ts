/**
 * useReducedMotion Hook
 *
 * Detects user's motion preferences and device capabilities to determine
 * if animations should be reduced or disabled.
 *
 * Respects:
 * - User's system preference (prefers-reduced-motion)
 * - Legacy device performance (auto-reduce on Tier 2/3 devices)
 * - Manual override via app settings
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const { shouldReduce, animationDuration } = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={{ opacity: 1 }}
 *       transition={{ duration: animationDuration(300) }}
 *     />
 *   );
 * }
 * ```
 *
 * Created: December 30, 2024
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  getDeviceCapabilities,
  type DeviceCapabilities,
} from '../../core/utils/deviceCapabilities';

// ============================================================================
// TYPES
// ============================================================================

export interface ReducedMotionConfig {
  /** Whether to respect system preference */
  respectSystemPreference: boolean;
  /** Whether to auto-reduce on legacy devices */
  reduceOnLegacyDevices: boolean;
  /** Device tier threshold for auto-reduce (2 = Tier 2+, 3 = Tier 3 only) */
  legacyTierThreshold: 2 | 3;
  /** Base duration multiplier for legacy devices (0-1) */
  legacyDurationMultiplier: number;
}

export interface UseReducedMotionResult {
  /** Whether animations should be reduced */
  shouldReduce: boolean;
  /** Whether user's system prefers reduced motion */
  systemPrefersReduced: boolean;
  /** Whether device is considered legacy */
  isLegacyDevice: boolean;
  /** Device support tier */
  deviceTier: 1 | 2 | 3;
  /** Calculate animation duration based on preferences */
  animationDuration: (baseDuration: number) => number;
  /** Calculate transition duration */
  transitionDuration: (baseDuration: number) => number;
  /** Get animation style object (duration, ease, etc.) */
  getAnimationStyle: (baseDuration?: number) => AnimationStyle;
  /** Get CSS transition string */
  getTransition: (property: string, baseDuration?: number) => string;
}

export interface AnimationStyle {
  duration: number;
  ease: string;
  disabled: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ReducedMotionConfig = {
  respectSystemPreference: true,
  reduceOnLegacyDevices: true,
  legacyTierThreshold: 2,
  legacyDurationMultiplier: 0.5,
};

const DEFAULT_BASE_DURATION = 300;
const MIN_DURATION = 50; // Minimum visible duration
const DISABLED_DURATION = 0.01; // Nearly instant for reduced motion

// ============================================================================
// HOOK
// ============================================================================

export function useReducedMotion(
  config: Partial<ReducedMotionConfig> = {},
): UseReducedMotionResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // System preference state
  const [systemPrefersReduced, setSystemPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Device capabilities
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);

  // Initialize on mount
  useEffect(() => {
    // Get device capabilities
    const caps = getDeviceCapabilities();
    setDeviceCapabilities(caps);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersReduced(e.matches);
    };

    // Set initial value
    setSystemPrefersReduced(mediaQuery.matches);

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Derived values
  const isLegacyDevice = deviceCapabilities?.isLegacyDevice ?? false;
  const deviceTier = deviceCapabilities?.supportTier ?? 1;

  // Should we reduce animations?
  const shouldReduce = useMemo(() => {
    // System preference takes highest priority if enabled
    if (finalConfig.respectSystemPreference && systemPrefersReduced) {
      return true;
    }

    // Check legacy device setting
    if (finalConfig.reduceOnLegacyDevices && deviceTier >= finalConfig.legacyTierThreshold) {
      return true;
    }

    return false;
  }, [
    systemPrefersReduced,
    deviceTier,
    finalConfig.respectSystemPreference,
    finalConfig.reduceOnLegacyDevices,
    finalConfig.legacyTierThreshold,
  ]);

  // Calculate animation duration
  const animationDuration = useCallback(
    (baseDuration: number): number => {
      // Full disable for reduced motion
      if (systemPrefersReduced && finalConfig.respectSystemPreference) {
        return DISABLED_DURATION;
      }

      // Reduce for legacy devices
      if (isLegacyDevice && finalConfig.reduceOnLegacyDevices) {
        const multiplier = deviceTier === 3 ? 0.3 : finalConfig.legacyDurationMultiplier;
        return Math.max(MIN_DURATION, baseDuration * multiplier);
      }

      return baseDuration;
    },
    [
      systemPrefersReduced,
      isLegacyDevice,
      deviceTier,
      finalConfig.respectSystemPreference,
      finalConfig.reduceOnLegacyDevices,
      finalConfig.legacyDurationMultiplier,
    ],
  );

  // Alias for transition duration
  const transitionDuration = animationDuration;

  // Get animation style object
  const getAnimationStyle = useCallback(
    (baseDuration = DEFAULT_BASE_DURATION): AnimationStyle => {
      const duration = animationDuration(baseDuration);

      return {
        duration,
        ease: shouldReduce ? 'linear' : 'ease-out',
        disabled: duration <= DISABLED_DURATION,
      };
    },
    [animationDuration, shouldReduce],
  );

  // Get CSS transition string
  const getTransition = useCallback(
    (property: string, baseDuration = DEFAULT_BASE_DURATION): string => {
      const duration = animationDuration(baseDuration);

      if (duration <= DISABLED_DURATION) {
        return 'none';
      }

      const ease = shouldReduce ? 'linear' : 'ease-out';
      return `${property} ${duration}ms ${ease}`;
    },
    [animationDuration, shouldReduce],
  );

  return {
    shouldReduce,
    systemPrefersReduced,
    isLegacyDevice,
    deviceTier,
    animationDuration,
    transitionDuration,
    getAnimationStyle,
    getTransition,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick check for reduced motion (non-hook, for edge cases)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get CSS for conditional animations
 */
export function getReducedMotionCSS(): string {
  return `
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useReducedMotion;
