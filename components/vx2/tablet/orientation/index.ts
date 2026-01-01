/**
 * Tablet Orientation Components
 * 
 * Components for enforcing horizontal-only orientation on iPads.
 */

export { default as OrientationGuard } from './OrientationGuard';
export { default as PortraitBlocker } from './PortraitBlocker';

// Re-export types
export type {
  OrientationGuardProps,
  PortraitBlockerProps,
} from '../../core/types/tablet';

