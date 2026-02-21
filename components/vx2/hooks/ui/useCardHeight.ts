/**
 * useCardHeight - Fixed Margin Card Sizing (ZOOM-STABLE VERSION)
 *
 * CRITICAL FIX: This version locks dimensions on initial load and does NOT
 * recalculate on browser zoom or resize. This prevents the "jumpy card" issue
 * where zooming causes the card to resize.
 *
 * The card size is calculated ONCE based on:
 * - Initial viewport dimensions (before any zoom)
 * - Device status bar height
 * - Fixed pixel margins
 *
 * After initial calculation, dimensions are LOCKED and won't change until
 * the page is refreshed or the component remounts.
 *
 * @module useCardHeight
 */

import { useState, useEffect, useMemo, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Device preset ID for phone frame simulation
 */
export type DevicePresetId =
  | 'iphone-se'
  | 'iphone-13-mini'
  | 'iphone-12'
  | 'iphone-13'
  | 'iphone-15'
  | 'iphone-11'
  | 'iphone-12-pro-max'
  | 'iphone-13-pro-max'
  | 'iphone-14-pro-max'
  | 'iphone-16-pro-max'
  | string; // Allow any string for flexibility

/**
 * Configuration options for margin-based card sizing
 */
export interface UseCardHeightOptions {
  /** Device preset ID (for phone frames in sandbox/demo) */
  devicePreset?: DevicePresetId;

  // ========================================
  // MARGIN CONFIGURATION
  // ========================================

  /** Pixels between status bar and card top edge */
  topMargin?: number;

  /** Pixels between card bottom edge and tab bar */
  bottomMargin?: number;

  /** Pixels between left screen edge and card */
  leftMargin?: number;

  /** Pixels between right screen edge and card */
  rightMargin?: number;

  // ========================================
  // HEIGHT CONSTRAINTS
  // ========================================

  /** Minimum card height in pixels */
  minHeight?: number;

  /** Maximum card height in pixels (optional) */
  maxHeight?: number;

  // ========================================
  // WIDTH CONSTRAINTS
  // ========================================

  /** Minimum card width in pixels */
  minWidth?: number;

  /** Maximum card width in pixels */
  maxWidth?: number;

  /**
   * If true, recalculates on resize/zoom (old behavior).
   * If false (default), locks dimensions after initial calculation.
   *
   * Set to false to prevent zoom-induced resizing.
   */
  allowResize?: boolean;
}

/**
 * Return value from useCardHeight hook
 */
export interface CardHeightResult {
  /** Final card height in pixels (after constraints) */
  height: number | undefined;

  /** Final card width in pixels (after constraints) */
  width: number | undefined;

  /** Available height before constraints */
  availableHeight: number | undefined;

  /** Available width before constraints */
  availableWidth: number | undefined;

  /** Detected status bar height */
  statusBarHeight: number | undefined;

  /** Tab bar height (constant 81px) */
  tabBarHeight: number;

  /** Current viewport height */
  viewportHeight: number | undefined;

  /** Current viewport width */
  viewportWidth: number | undefined;

  /** Configuration used (for debugging) */
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  /** Whether calculation is complete (false during SSR) */
  isReady: boolean;

  /** True if dimensions are locked (won't change on zoom) */
  isLocked: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default margin and constraint values
 */
const DEFAULTS = {
  // Margins (pixels)
  topMargin: 16,
  bottomMargin: 16,
  leftMargin: 16,
  rightMargin: 16,

  // Height constraints
  minHeight: 400,
  maxHeight: undefined as number | undefined,

  // Width constraints
  minWidth: 300,
  maxWidth: 420,

  // Lock dimensions by default (prevent zoom-induced resizing)
  allowResize: false,
} as const;

/**
 * Tab bar total height (constant across all iOS devices)
 *
 * Breakdown:
 * - paddingTop: 10px
 * - content minHeight: 44px
 * - paddingBottom: 10px
 * - homeIndicatorMarginTop: 8px
 * - homeIndicatorHeight: 5px
 * - homeIndicatorMarginBottom: 4px
 *
 * Total: 81px
 */
const TAB_BAR_HEIGHT = 81;

/**
 * Status bar heights by device
 * Used when devicePreset is provided (phone frames)
 */
const STATUS_BAR_BY_DEVICE: Record<string, number> = {
  'iphone-se': 20,
  'iphone-13-mini': 50,
  'iphone-12': 47,
  'iphone-13': 47,
  'iphone-15': 59,
  'iphone-11': 48,
  'iphone-12-pro-max': 47,
  'iphone-13-pro-max': 47,
  'iphone-14-pro-max': 59,
  'iphone-16-pro-max': 62,
};

/**
 * Viewport height thresholds for status bar estimation
 */
const VIEWPORT_THRESHOLDS = {
  COMPACT: 700, // iPhone SE and similar
  STANDARD: 860, // iPhone 12/13/14
  LARGE: 960, // Pro Max models
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the TRUE device viewport dimensions, ignoring zoom level.
 *
 * For phone frames (device comparison page), we need to use the actual
 * rendered viewport (innerWidth/innerHeight), not screen dimensions.
 * Screen dimensions are in device pixels and don't match CSS pixels for frames.
 */
function getTrueDeviceDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 390, height: 844 }; // Default iPhone 13 size
  }

  // Always use innerWidth/innerHeight for accurate CSS pixel dimensions
  // This works correctly for:
  // 1. Phone frames in browser (device comparison page)
  // 2. Real mobile devices (innerWidth/innerHeight accounts for zoom)
  // 3. Desktop browsers
  //
  // Note: We capture this ONCE on mount and lock it, so zoom changes
  // won't affect the calculation (that's the zoom fix).
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Detect status bar height
 *
 * Priority:
 * 1. Device preset (if provided)
 * 2. Viewport-based estimation
 */
function detectStatusBarHeight(devicePreset?: string, viewportHeight?: number): number {
  // Method 1: Use device preset
  if (devicePreset && STATUS_BAR_BY_DEVICE[devicePreset] !== undefined) {
    return STATUS_BAR_BY_DEVICE[devicePreset];
  }

  // Server-side: return default
  if (typeof window === 'undefined') {
    return 47;
  }

  // Method 2: Estimate from viewport height
  const vh = viewportHeight ?? window.screen?.height ?? window.innerHeight;

  if (vh <= VIEWPORT_THRESHOLDS.COMPACT) {
    return 20; // iPhone SE
  }

  if (vh <= VIEWPORT_THRESHOLDS.STANDARD) {
    // Check for Dynamic Island devices
    const ua = navigator.userAgent;
    if (/iPhone\s*(14|15|16)\s*Pro/i.test(ua)) {
      return 59;
    }
    return 47; // Standard notch
  }

  if (vh <= VIEWPORT_THRESHOLDS.LARGE) {
    // Pro Max models
    if (vh >= 950) return 62; // iPhone 16 Pro Max
    return 59; // iPhone 14/15 Pro Max
  }

  // Default
  return 47;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Calculate card dimensions based on fixed pixel margins
 *
 * @param options - Configuration options
 * @returns Calculated dimensions and state
 *
 * @example
 * ```tsx
 * function LobbyTab() {
 *   const { height, width, isReady } = useCardHeight({
 *     topMargin: 16,
 *     bottomMargin: 16,
 *     leftMargin: 16,
 *     rightMargin: 16,
 *     maxWidth: 420,
 *   });
 *
 *   return (
 *     <div style={{
 *       width: width ? `${width}px` : '100%',
 *       height: height ? `${height}px` : 'auto',
 *     }}>
 *       <TournamentCard />
 *     </div>
 *   );
 * }
 * ```
 */
export function useCardHeight(options: UseCardHeightOptions = {}): CardHeightResult {
  // ----------------------------------------
  // Merge options with defaults
  // ----------------------------------------
  const {
    devicePreset,
    topMargin = DEFAULTS.topMargin,
    bottomMargin = DEFAULTS.bottomMargin,
    leftMargin = DEFAULTS.leftMargin,
    rightMargin = DEFAULTS.rightMargin,
    minHeight = DEFAULTS.minHeight,
    maxHeight = DEFAULTS.maxHeight,
    minWidth = DEFAULTS.minWidth,
    maxWidth = DEFAULTS.maxWidth,
    allowResize = DEFAULTS.allowResize,
  } = options;

  // ----------------------------------------
  // LOCKED DIMENSIONS STATE
  // Once calculated, these don't change (unless allowResize is true)
  // ----------------------------------------
  const [lockedDimensions, setLockedDimensions] = useState<{
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
    statusBarHeight: number;
  } | null>(null);

  // Track if we've already calculated (ref used only for this boolean flag)
  const hasCalculatedRef = useRef(false);

  // Initialize isReady as false to ensure consistent server/client rendering
  // Components should wait for isReady before using dimensions
  const [isReady, setIsReady] = useState(false);

  // ----------------------------------------
  // Calculate dimensions ONCE on mount
  // ----------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If already locked and not allowing resize, skip
    if (hasCalculatedRef.current && !allowResize) {
      setIsReady(true);
      return;
    }

    const calculateAndLock = () => {
      // Get TRUE device dimensions (ignores zoom)
      const { width: vw, height: vh } = getTrueDeviceDimensions();

      // Detect status bar
      const statusBar = detectStatusBarHeight(devicePreset, vh);

      // Calculate available space
      const availH = vh - statusBar - TAB_BAR_HEIGHT - topMargin - bottomMargin;
      const availW = vw - leftMargin - rightMargin;

      // Apply constraints
      const finalHeight = Math.floor(clamp(availH, minHeight, maxHeight));
      const finalWidth = Math.floor(clamp(availW, minWidth, maxWidth));

      // LOCK the dimensions
      setLockedDimensions({
        width: finalWidth,
        height: finalHeight,
        viewportWidth: vw,
        viewportHeight: vh,
        statusBarHeight: statusBar,
      });

      hasCalculatedRef.current = true;
      setIsReady(true);
    };

    // Calculate immediately
    calculateAndLock();

    // ONLY add resize listeners if allowResize is true
    if (allowResize) {
      const handleResize = () => {
        // Reset lock to recalculate
        hasCalculatedRef.current = false;
        calculateAndLock();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 150);
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
        }
      };
    }

    // No cleanup needed if we're not listening for resize
    return undefined;
  }, [
    devicePreset,
    topMargin,
    bottomMargin,
    leftMargin,
    rightMargin,
    minHeight,
    maxHeight,
    minWidth,
    maxWidth,
    allowResize,
  ]);

  // ----------------------------------------
  // Return locked dimensions
  // ----------------------------------------
  return {
    height: lockedDimensions?.height,
    width: lockedDimensions?.width,
    availableHeight: lockedDimensions
      ? lockedDimensions.viewportHeight -
        lockedDimensions.statusBarHeight -
        TAB_BAR_HEIGHT -
        topMargin -
        bottomMargin
      : undefined,
    availableWidth: lockedDimensions
      ? lockedDimensions.viewportWidth - leftMargin - rightMargin
      : undefined,
    statusBarHeight: lockedDimensions?.statusBarHeight,
    tabBarHeight: TAB_BAR_HEIGHT,
    viewportHeight: lockedDimensions?.viewportHeight,
    viewportWidth: lockedDimensions?.viewportWidth,
    margins: {
      top: topMargin,
      bottom: bottomMargin,
      left: leftMargin,
      right: rightMargin,
    },
    isReady,
    isLocked: !allowResize && lockedDimensions !== null,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useCardHeight;
