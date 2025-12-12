/**
 * VX Hooks - Central Export
 * 
 * Custom React hooks for common patterns in VX components.
 */

// Timer
export { default as useTimer, useCountdown } from './useTimer';
export type { UseTimerOptions, UseTimerReturn, UseCountdownOptions } from './useTimer';

// Auto-scroll
export { 
  default as useAutoScroll, 
  useScrollToPick, 
  useHorizontalScroll 
} from './useAutoScroll';
export type { 
  UseAutoScrollOptions, 
  UseAutoScrollReturn, 
  UseScrollToPickOptions,
  UseHorizontalScrollReturn,
} from './useAutoScroll';

// Local storage
export { 
  default as useLocalStorage,
  useSortPreference,
  useFilterPreference,
  useViewMode,
  useCollapsedState,
} from './useLocalStorage';

