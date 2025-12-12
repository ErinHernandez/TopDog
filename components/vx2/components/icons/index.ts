/**
 * VX2 Icon Library
 * 
 * Centralized icon components for consistent usage across the app.
 * All icons follow the same interface for easy swapping and consistent sizing.
 * 
 * @example
 * ```tsx
 * import { ChevronRight, Close, Payment } from '../../components/icons';
 * 
 * <ChevronRight size={20} color="#fff" />
 * ```
 */

// Types
export type { IconProps, IconComponent } from './types';
export { DEFAULT_ICON_PROPS } from './types';

// Navigation icons
export * from './navigation';

// Action icons
export * from './actions';

// Menu icons
export * from './menu';

