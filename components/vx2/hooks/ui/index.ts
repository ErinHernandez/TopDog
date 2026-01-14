/**
 * UI Hooks
 * 
 * Hooks for UI interactions and behaviors.
 */

export { useLongPress } from './useLongPress';
export type { 
  UseLongPressOptions,
  LongPressHandlers,
  UseLongPressResult,
} from './useLongPress';

export { useDebounce, useDebouncedCallback } from './useDebounce';
export type { 
  UseDebounceOptions,
  UseDebouncedCallbackResult,
} from './useDebounce';

// Tablet hooks
export { useTabletOrientation } from './useTabletOrientation';
export { useIsTablet } from './useIsTablet';
export { useTabletLayout } from './useTabletLayout';

// Device capability hooks (legacy device support)
export {
  useDeviceCapabilities,
  useIsLegacyDevice,
  useDeviceTier,
  useReducedAnimations,
  useAnimationDuration,
  useBatchSize,
  useDebounceDelay,
  getAnimationDuration,
  shouldReduceAnimations,
  getRecommendedBatchSize,
  getRecommendedDebounceDelay,
  applyDeviceClasses,
} from './useDeviceCapabilities';

// Reduced motion hooks
export {
  useReducedMotion,
  prefersReducedMotion,
  getReducedMotionCSS,
} from './useReducedMotion';
export type {
  ReducedMotionConfig,
  UseReducedMotionResult,
  AnimationStyle,
} from './useReducedMotion';

// Device class hooks (responsive sizing)
export {
  useDeviceClass,
  useResponsiveScale,
  useResponsiveCSSVars,
  useDeviceResponsive,
  useDeviceClassDebug,
} from './useDeviceClass';

// Viewport height hooks
export { useStableViewportHeight } from './useStableViewportHeight';