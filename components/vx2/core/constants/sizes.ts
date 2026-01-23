/**
 * VX2 Size Constants
 * 
 * Responsive sizing system for mobile-first development.
 * Migrated from VX with enterprise-grade organization.
 */

// ============================================================================
// TOUCH TARGETS (Apple HIG Compliant)
// ============================================================================

export const TOUCH_TARGETS = {
  /** Minimum touch target (Apple HIG) */
  min: 44,
  /** Comfortable touch target */
  comfort: 48,
  /** Large action buttons */
  large: 56,
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

/**
 * Centralized z-index scale to prevent stacking conflicts
 */
export const Z_INDEX = {
  /** Content that scrolls behind everything */
  base: 0,
  /** Slightly elevated content */
  elevated: 10,
  /** Sticky headers within content */
  stickyContent: 20,
  /** Dropdowns and menus */
  dropdown: 100,
  /** App header */
  header: 150,
  /** Tab bar / footer */
  tabBar: 150,
  /** Sticky elements */
  sticky: 200,
  /** Fixed positioned elements */
  fixed: 300,
  /** Modal backdrop */
  modalBackdrop: 400,
  /** Modal content */
  modal: 500,
  /** Popovers */
  popover: 600,
  /** Tooltips */
  tooltip: 700,
  /** Toast notifications */
  toast: 800,
  /** Maximum (critical overlays) */
  max: 9999,
} as const;

// ============================================================================
// HEADER SIZES
// ============================================================================

export const HEADER = {
  /** Total header height (compact for unified header) */
  height: 26,
  /** Horizontal padding */
  paddingX: 16,
  /** Logo height */
  logoHeight: 22,
  /** Logo max width */
  logoMaxWidth: 120,
  /** Button touch target */
  buttonSize: 44,
  /** Icon size in buttons */
  iconSize: 24,
  /** Icon stroke width */
  iconStrokeWidth: 2.5,
  /** Deposit button size */
  depositButtonSize: 32,
  /** Deposit icon size */
  depositIconSize: 20,
  /** Title font size */
  titleFontSize: 18,
} as const;

// ============================================================================
// TAB BAR SIZES
// ============================================================================

export const TAB_BAR = {
  /** Min height for touch targets */
  minHeight: 44,
  /** Padding above tabs */
  paddingTop: 10,
  /** Padding below tabs */
  paddingBottom: 10,
  /** Horizontal padding per tab */
  tabPaddingX: 2,
  /** Icon size */
  iconSize: 24,
  /** Label font size */
  labelFontSize: 10,
  /** Label line height */
  labelLineHeight: 12,
  /** Space between icon and label */
  labelMarginTop: 4,
  /** Badge min width */
  badgeMinWidth: 18,
  /** Badge height */
  badgeHeight: 18,
  /** Badge font size */
  badgeFontSize: 10.5,
  /** Badge offset from icon top */
  badgeOffsetTop: 1,
  /** Badge offset from icon right */
  badgeOffsetRight: -12,
  /** Home indicator width */
  homeIndicatorWidth: 134,
  /** Home indicator height */
  homeIndicatorHeight: 5,
  /** Home indicator margin top */
  homeIndicatorMarginTop: 8,
  /** Home indicator margin bottom */
  homeIndicatorMarginBottom: 4,
} as const;

// ============================================================================
// CONTENT AREA
// ============================================================================

export const CONTENT = {
  /** Standard horizontal padding */
  paddingX: 16,
  /** Standard vertical padding */
  paddingY: 16,
  /** Standard gap between items */
  gap: 12,
  /** Large gap */
  gapLarge: 16,
  /** Small gap */
  gapSmall: 8,
} as const;

// ============================================================================
// SPACING SCALE
// ============================================================================

export const SPACING = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  '2xl': 32,
  /** 48px */
  '3xl': 48,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const RADIUS = {
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 24px */
  '2xl': 24,
  /** Full round */
  full: 9999,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
    '5xl': 52,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ============================================================================
// BREAKPOINTS (mobile-only)
// ============================================================================

export const BREAKPOINTS = {
  /** Small phones */
  xs: 320,
  /** Standard phones (iPhone) */
  sm: 375,
  /** Large phones (iPhone Plus/Max) */
  md: 414,
} as const;

// ============================================================================
// PHONE FRAME (For Desktop Preview)
// ============================================================================

export const PHONE_FRAME = {
  /** Sandbox-matched width */
  width: 280,
  /** Sandbox-matched height */
  height: 580,
  /** Border radius */
  borderRadius: 36,
  /** Frame padding */
  framePadding: 8,
  /** Bezel color */
  bezelColor: '#000000',
} as const;

// ============================================================================
// DEVICE PRESETS (For Testing Different iPhone Models)
// ============================================================================

export type DevicePresetId = 
  | 'iphone-se'            // iPhone SE / iPhone 8 (375x667, Home Button)
  | 'iphone-mini'          // iPhone 12/13 Mini (375x812, Small Notch)
  | 'iphone-12'            // iPhone 12 (390x844, Large Notch)
  | 'iphone-13'            // iPhone 13 (390x844, Small Notch)
  | 'iphone-15'            // iPhone 15 (393x852, Dynamic Island)
  | 'iphone-11'            // iPhone 11 (414x896, Large Notch)
  | 'iphone-12-pro-max'    // iPhone 12 Pro Max (428x926, Large Notch)
  | 'iphone-13-pro-max'    // iPhone 13 Pro Max (428x926, Small Notch)
  | 'iphone-14-pro-max'    // iPhone 14 Pro Max (430x932, Dynamic Island)
  | 'iphone-16-pro-max';   // iPhone 16 Pro Max (440x956, Dynamic Island)

export interface DevicePreset {
  id: DevicePresetId;
  name: string;
  /** Screen width in points */
  width: number;
  /** Screen height in points */
  height: number;
  /** Scale factor for preview (to fit on screen) */
  scale: number;
  /** Whether device has Dynamic Island */
  hasDynamicIsland: boolean;
  /** Whether device has notch (older Face ID models) */
  hasNotch: boolean;
  /** Status bar height */
  statusBarHeight: number;
  /** Home indicator height (0 for home button devices) */
  homeIndicatorHeight: number;
  /** Screen corner radius */
  screenRadius: number;
  /** Bezel corner radius */
  bezelRadius: number;
  /** Dynamic Island / notch dimensions */
  notchWidth?: number;
  notchHeight?: number;
  /** Dynamic Island top offset from screen edge */
  islandTopOffset?: number;
  /** Bezel width around the screen */
  bezelWidth?: number;
}

export const DEVICE_PRESETS: Record<DevicePresetId, DevicePreset> = {
  'iphone-se': {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    scale: 0.87,
    hasDynamicIsland: false,
    hasNotch: false,
    statusBarHeight: 20,
    homeIndicatorHeight: 0,
    screenRadius: 0,
    bezelRadius: 40,
  },
  'iphone-mini': {
    id: 'iphone-mini',
    name: 'iPhone 13 Mini',
    width: 375,
    height: 812,
    scale: 0.72,
    hasDynamicIsland: false,
    hasNotch: true,
    statusBarHeight: 50,
    homeIndicatorHeight: 34,
    screenRadius: 40,
    bezelRadius: 48,
    notchWidth: 145,
    notchHeight: 32,
  },
  'iphone-12': {
    id: 'iphone-12',
    name: 'iPhone 12',
    width: 390,
    height: 844,
    scale: 0.69,
    hasDynamicIsland: false,
    hasNotch: true,
    statusBarHeight: 47,
    homeIndicatorHeight: 34,
    screenRadius: 44,
    bezelRadius: 52,
    notchWidth: 209,
    notchHeight: 32,
  },
  'iphone-13': {
    id: 'iphone-13',
    name: 'iPhone 13',
    width: 390,
    height: 844,
    scale: 0.69,
    hasDynamicIsland: false,
    hasNotch: true,
    statusBarHeight: 47,
    homeIndicatorHeight: 34,
    screenRadius: 44,
    bezelRadius: 52,
    notchWidth: 162,
    notchHeight: 32,
  },
  'iphone-15': {
    id: 'iphone-15',
    name: 'iPhone 15',
    width: 393,
    height: 852,
    scale: 0.68,
    hasDynamicIsland: true,
    hasNotch: false,
    statusBarHeight: 59,
    homeIndicatorHeight: 34,
    screenRadius: 47,
    bezelRadius: 55,
    notchWidth: 126,
    notchHeight: 37,
  },
  'iphone-11': {
    id: 'iphone-11',
    name: 'iPhone 11',
    width: 414,
    height: 896,
    scale: 0.65,
    hasDynamicIsland: false,
    hasNotch: true,
    statusBarHeight: 48,
    homeIndicatorHeight: 34,
    screenRadius: 40,
    bezelRadius: 48,
    notchWidth: 209,
    notchHeight: 32,
  },
  'iphone-12-pro-max': {
    id: 'iphone-12-pro-max',
    name: 'iPhone 12 Pro Max',
    width: 428,
    height: 926,
    scale: 0.63,
    hasDynamicIsland: false,
    hasNotch: true,
    statusBarHeight: 47,
    homeIndicatorHeight: 34,
    screenRadius: 44,
    bezelRadius: 52,
    notchWidth: 209,
    notchHeight: 32,
  },
  'iphone-13-pro-max': {
    id: 'iphone-13-pro-max',
    name: 'iPhone 13 Pro Max',
    width: 428,
    height: 926,
    scale: 0.63,
    hasDynamicIsland: false,
    hasNotch: true,
    statusBarHeight: 47,
    homeIndicatorHeight: 34,
    screenRadius: 44,
    bezelRadius: 52,
    notchWidth: 162,
    notchHeight: 32,
  },
  'iphone-14-pro-max': {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    scale: 0.62,
    hasDynamicIsland: true,
    hasNotch: false,
    statusBarHeight: 59,
    homeIndicatorHeight: 34,
    screenRadius: 55,
    bezelRadius: 63,
    notchWidth: 126,
    notchHeight: 37,
  },
  'iphone-16-pro-max': {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    width: 440,
    height: 956,
    scale: 0.61,
    hasDynamicIsland: true,
    hasNotch: false,
    statusBarHeight: 62,
    homeIndicatorHeight: 34,
    screenRadius: 55,
    bezelRadius: 63,
    notchWidth: 126,
    notchHeight: 37,
  },
} as const;

/** Default device for previews */
export const DEFAULT_DEVICE: DevicePresetId = 'iphone-15';

/** All device preset IDs in display order (smallest to largest) */
export const ALL_DEVICES: DevicePresetId[] = [
  'iphone-se',
  'iphone-mini',
  'iphone-12',
  'iphone-13',
  'iphone-15',
  'iphone-11',
  'iphone-12-pro-max',
  'iphone-13-pro-max',
  'iphone-14-pro-max',
  'iphone-16-pro-max',
];

// ============================================================================
// SAFE AREAS
// ============================================================================

export const SAFE_AREA = {
  /** iOS top safe area (notch) */
  top: 'env(safe-area-inset-top, 0px)',
  /** iOS bottom safe area (home indicator) */
  bottom: 'env(safe-area-inset-bottom, 0px)',
  /** Left safe area (landscape) */
  left: 'env(safe-area-inset-left, 0px)',
  /** Right safe area (landscape) */
  right: 'env(safe-area-inset-right, 0px)',
} as const;

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const DURATION = {
  /** Fast animations (75ms) */
  fast: 75,
  /** Normal animations (150ms) */
  normal: 150,
  /** Slow animations (300ms) */
  slow: 300,
  /** Page transitions (200ms) */
  page: 200,
} as const;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const EASING = {
  /** Standard ease */
  default: 'ease',
  /** Ease in */
  in: 'ease-in',
  /** Ease out */
  out: 'ease-out',
  /** Ease in-out */
  inOut: 'ease-in-out',
  /** Spring-like bounce */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

