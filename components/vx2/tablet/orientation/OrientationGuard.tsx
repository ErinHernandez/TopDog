/**
 * OrientationGuard - Horizontal-Only Enforcer
 * 
 * Wraps tablet content and shows portrait blocker when device
 * is rotated to portrait orientation.
 * 
 * @example
 * ```tsx
 * <OrientationGuard>
 *   <TabletDraftRoomVX2 roomId="123" />
 * </OrientationGuard>
 * ```
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { useTabletOrientation } from '../../hooks/ui/useTabletOrientation';
import PortraitBlocker from './PortraitBlocker';
import type { OrientationGuardProps } from '../../core/types/tablet';

/**
 * OrientationGuard - Enforces landscape orientation on tablets
 * 
 * Shows a friendly "please rotate" screen when the device is in portrait mode.
 * Can be disabled for testing or specific use cases.
 */
export default function OrientationGuard({
  children,
  enforceHorizontal = true,
  customBlocker,
}: OrientationGuardProps): ReactElement {
  const { isPortrait, isLandscape, orientation } = useTabletOrientation();
  
  // If enforcement is disabled, always show children
  if (!enforceHorizontal) {
    return <>{children}</>;
  }
  
  // If in portrait mode, show blocker
  if (isPortrait) {
    // Use custom blocker if provided
    if (customBlocker) {
      return <>{customBlocker}</>;
    }
    
    return <PortraitBlocker />;
  }
  
  // If orientation is unknown (SSR or initial load), show children
  // This prevents flash of blocker during hydration
  if (orientation === 'unknown') {
    return <>{children}</>;
  }
  
  // Landscape mode - show content
  return <>{children}</>;
}

