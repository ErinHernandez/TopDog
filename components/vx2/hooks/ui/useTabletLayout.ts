/**
 * useTabletLayout - Tablet Layout Configuration Hook
 * 
 * Provides layout mode recommendations based on viewport size.
 * Determines whether to use three-panel, two-panel, or single-panel layout.
 * 
 * @example
 * ```tsx
 * const { layoutMode, isSmallTablet, dimensions } = useTabletLayout();
 * 
 * if (layoutMode === 'single-panel') {
 *   return <TabNavigation />;
 * }
 * return <ThreePanelLayout />;
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import type { 
  DraftLayoutMode, 
  PanelDimensions,
  PanelVisibility,
  UseTabletLayoutResult,
} from '../../core/types/tablet';
import { 
  TABLET_BREAKPOINTS, 
  TABLET_PANELS, 
  TABLET_FRAME 
} from '../../core/constants/tablet';

/**
 * Determine layout mode based on viewport width
 */
function getLayoutMode(width: number): DraftLayoutMode {
  // iPad Pro 12.9" and similar (1024px+ height in landscape = wide viewport)
  if (width >= 1200) {
    return 'three-panel';
  }
  
  // iPad Pro 11", Air, standard iPads (834-1199px)
  if (width >= 900) {
    return 'three-panel';
  }
  
  // Smaller iPads, iPad Mini
  if (width >= 744) {
    return 'two-panel';
  }
  
  // Very small (shouldn't happen on tablets)
  return 'single-panel';
}

/**
 * Calculate panel dimensions for a given viewport width
 */
function calculateDimensions(
  viewportWidth: number,
  visibility: PanelVisibility,
  leftWidth: number,
  rightWidth: number
): PanelDimensions {
  const dividers = TABLET_PANELS.dividerWidth * 2;
  const visibleLeft = visibility.left ? leftWidth : 0;
  const visibleRight = visibility.right ? rightWidth : 0;
  const centerWidth = viewportWidth - visibleLeft - visibleRight - dividers;
  
  return {
    left: visibleLeft,
    center: Math.max(TABLET_PANELS.center.minWidth, centerWidth),
    right: visibleRight,
  };
}

/**
 * Hook to get tablet layout configuration
 * @returns Layout mode and dimensions
 */
export function useTabletLayout(): UseTabletLayoutResult {
  // Viewport dimensions
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : TABLET_FRAME.width,
    height: typeof window !== 'undefined' ? window.innerHeight : TABLET_FRAME.height,
  });
  
  // Listen for resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determine layout mode
  const layoutMode = useMemo<DraftLayoutMode>(() => {
    return getLayoutMode(viewport.width);
  }, [viewport.width]);
  
  // Default visibility based on layout mode
  const visibility = useMemo<PanelVisibility>(() => {
    switch (layoutMode) {
      case 'three-panel':
        return { left: true, center: true, right: true };
      case 'two-panel':
        // Hide right panel by default on smaller tablets
        return { left: true, center: true, right: false };
      case 'single-panel':
        return { left: false, center: true, right: false };
      default:
        return { left: true, center: true, right: true };
    }
  }, [layoutMode]);
  
  // Calculate dimensions
  const dimensions = useMemo<PanelDimensions>(() => {
    return calculateDimensions(
      viewport.width,
      visibility,
      TABLET_PANELS.left.defaultWidth,
      TABLET_PANELS.right.defaultWidth
    );
  }, [viewport.width, visibility]);
  
  // Size classifications
  const isSmallTablet = useMemo(() => {
    return viewport.height < TABLET_BREAKPOINTS.STANDARD;
  }, [viewport.height]);
  
  const isLargeTablet = useMemo(() => {
    return viewport.height >= TABLET_BREAKPOINTS.XL;
  }, [viewport.height]);
  
  return {
    layoutMode,
    dimensions,
    visibility,
    viewport,
    isSmallTablet,
    isLargeTablet,
  };
}

export default useTabletLayout;

