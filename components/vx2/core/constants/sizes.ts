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
  /** Total header height (including safe area) */
  height: 60,
  /** Horizontal padding */
  paddingX: 16,
  /** Logo height */
  logoHeight: 40,
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
    xs: 11,
    sm: 13,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
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
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  /** Small phones */
  sm: 375,
  /** Large phones */
  md: 428,
  /** Tablets */
  lg: 768,
  /** Small laptops */
  xl: 1024,
  /** Desktops */
  '2xl': 1280,
} as const;

// ============================================================================
// PHONE FRAME (For Desktop Preview)
// ============================================================================

export const PHONE_FRAME = {
  /** iPhone 12/13/14 width */
  width: 375,
  /** iPhone 12/13/14 height */
  height: 812,
  /** Border radius */
  borderRadius: 24,
  /** Frame padding */
  framePadding: 4,
  /** Bezel color */
  bezelColor: '#000000',
} as const;

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

