/**
 * VX2 Tablet Constants
 * 
 * iPad-specific sizing system for horizontal/landscape orientation.
 * All measurements optimized for landscape iPad displays.
 */

import { SPACING, RADIUS, TYPOGRAPHY as MOBILE_TYPOGRAPHY } from './sizes';

// ============================================================================
// TABLET FRAME (For Desktop Preview)
// ============================================================================

/**
 * Tablet frame dimensions for desktop preview
 * Default: iPad Pro 11" landscape
 */
export const TABLET_FRAME = {
  /** iPad Pro 11" landscape width */
  width: 1194,
  /** iPad Pro 11" landscape height */
  height: 834,
  /** iPad Pro 12.9" landscape width */
  widthXL: 1366,
  /** iPad Pro 12.9" landscape height */
  heightXL: 1024,
  /** iPad Mini landscape width */
  widthMini: 1133,
  /** iPad Mini landscape height */
  heightMini: 744,
  /** Border radius for modern iPads */
  borderRadius: 20,
  /** Frame bezel padding */
  framePadding: 4,
  /** Bezel color (Space Gray) */
  bezelColor: '#1C1C1E',
  /** Status bar height (iPadOS) */
  statusBarHeight: 24,
} as const;

// ============================================================================
// TABLET BREAKPOINTS
// ============================================================================

/**
 * iPad landscape width breakpoints
 */
export const TABLET_BREAKPOINTS = {
  /** iPad Mini landscape minimum (744px height) */
  MINI: 744,
  /** Standard iPad landscape (810px height) */
  STANDARD: 810,
  /** iPad Air / iPad Pro 11" landscape (834px height) */
  LARGE: 834,
  /** iPad Pro 12.9" landscape (1024px height) */
  XL: 1024,
  /** Maximum supported tablet width */
  MAX_WIDTH: 1366,
} as const;

// ============================================================================
// TABLET LAYOUT - Three Panel System
// ============================================================================

/**
 * Three-panel layout configuration for draft room
 */
export const TABLET_PANELS = {
  /** Left panel (Available Players) */
  left: {
    minWidth: 320,
    defaultWidth: 380,
    maxWidth: 450,
  },
  /** Center panel (Picks Bar + Board) - flexes to fill remaining space */
  center: {
    minWidth: 400,
  },
  /** Right panel (Queue + Roster) */
  right: {
    minWidth: 280,
    defaultWidth: 320,
    maxWidth: 400,
  },
  /** Panel divider visual width */
  dividerWidth: 1,
  /** Panel divider hit area for dragging */
  dividerHitArea: 8,
  /** Panel collapse animation duration */
  collapseAnimationMs: 200,
} as const;

// ============================================================================
// TABLET HEADER
// ============================================================================

/**
 * Tablet header dimensions
 */
export const TABLET_HEADER = {
  /** Header height */
  height: 56,
  /** Logo height */
  logoHeight: 36,
  /** Logo max width */
  logoMaxWidth: 150,
  /** Button touch target size */
  buttonSize: 44,
  /** Icon size in header */
  iconSize: 24,
  /** Horizontal padding */
  paddingX: 24,
  /** Timer display font size */
  timerFontSize: 32,
} as const;

// ============================================================================
// TABLET NAVIGATION
// ============================================================================

/**
 * Tablet navigation dimensions
 */
export const TABLET_NAV = {
  /** Sidebar width (collapsed, icons only) */
  sidebarWidth: 72,
  /** Sidebar width (expanded, with labels) */
  sidebarExpandedWidth: 240,
  /** Bottom bar height (alternative nav style) */
  bottomBarHeight: 64,
  /** Tab icon size */
  tabIconSize: 28,
  /** Tab label font size */
  tabLabelSize: 11,
  /** Tab touch target */
  tabTouchTarget: 48,
} as const;

// ============================================================================
// TABLET DRAFT ROOM
// ============================================================================

/**
 * Draft room specific dimensions for tablet
 * PIXEL-PERFECT MATCH to VX2 PicksBar.tsx constants
 */
export const TABLET_DRAFT = {
  /** Picks bar height - matched to VX2 containerHeight */
  picksBarHeight: 116,
  /** Pick card dimensions - EXACT match to VX2 PICKS_BAR_PX */
  pickCard: {
    width: 96,
    minWidth: 96,
    maxWidth: 96,
    margin: 1,
    borderRadius: 6,
    borderWidth: 4,
    headerHeight: 20,
    contentMinHeight: 78,
    gap: 0,
  },
  /** Pick card colors - EXACT match to VX2 */
  pickCardColors: {
    bg: '#374151',
    userBorder: '#1E3A5F',
    otherBorder: '#6B7280',
    urgentBorder: '#DC2626',
  },
  /** Player row height in list */
  playerRowHeight: 52,
  /** Player card expanded height */
  playerCardExpandedHeight: 280,
  /** Queue item height */
  queueItemHeight: 48,
  /** Roster cell height */
  rosterCellHeight: 44,
  /** Large timer display size */
  timerSize: 64,
  /** Draft board cell dimensions */
  boardCell: {
    width: 80,
    height: 72,
  },
  /** Filter button height */
  filterButtonHeight: 40,
  /** Search bar height */
  searchBarHeight: 44,
} as const;

// ============================================================================
// TABLET TYPOGRAPHY
// ============================================================================

/**
 * Tablet typography scale (slightly larger than mobile)
 */
export const TABLET_TYPOGRAPHY = {
  /** Scale factor vs mobile */
  scaleFactor: 1.1,
  
  /** Font sizes */
  fontSize: {
    /** Extra small: 12px (vs 11px mobile) */
    xs: 12,
    /** Small: 14px (vs 13px mobile) */
    sm: 14,
    /** Base: 16px (vs 14px mobile) */
    base: 16,
    /** Large: 18px (vs 16px mobile) */
    lg: 18,
    /** Extra large: 20px (vs 18px mobile) */
    xl: 20,
    /** 2XL: 26px (vs 24px mobile) */
    '2xl': 26,
    /** 3XL: 34px (vs 30px mobile) */
    '3xl': 34,
    /** 4XL: 40px (vs 36px mobile) */
    '4xl': 40,
  },
  
  /** Line heights */
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  /** Font weights */
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ============================================================================
// TABLET SPACING
// ============================================================================

/**
 * Tablet spacing scale (slightly larger than mobile)
 */
export const TABLET_SPACING = {
  /** Extra small: 6px */
  xs: 6,
  /** Small: 12px */
  sm: 12,
  /** Medium: 16px */
  md: 16,
  /** Large: 24px */
  lg: 24,
  /** Extra large: 32px */
  xl: 32,
  /** 2XL: 48px */
  '2xl': 48,
  /** 3XL: 64px */
  '3xl': 64,
} as const;

// ============================================================================
// TABLET TOUCH TARGETS
// ============================================================================

/**
 * Touch target sizes for tablet
 * Slightly smaller than phone due to pointer precision support
 */
export const TABLET_TOUCH = {
  /** Minimum touch target */
  min: 40,
  /** Comfortable touch target */
  comfort: 44,
  /** Large action buttons */
  large: 52,
} as const;

// ============================================================================
// TABLET SAFE AREAS (Landscape)
// ============================================================================

/**
 * Safe area CSS values for landscape iPad
 */
export const TABLET_SAFE_AREA = {
  /** Left safe area (newer iPads with sensors) */
  left: 'env(safe-area-inset-left, 0px)',
  /** Right safe area (newer iPads with sensors) */
  right: 'env(safe-area-inset-right, 0px)',
  /** Top safe area (usually 0 in landscape) */
  top: 'env(safe-area-inset-top, 0px)',
  /** Bottom safe area (usually 0 in landscape) */
  bottom: 'env(safe-area-inset-bottom, 0px)',
} as const;

// ============================================================================
// TABLET Z-INDEX SCALE
// ============================================================================

/**
 * Z-index scale for tablet components
 */
export const TABLET_Z_INDEX = {
  /** Base content */
  base: 0,
  /** Elevated content (cards) */
  elevated: 10,
  /** Sticky headers within panels */
  stickyContent: 20,
  /** Panel dividers */
  panelDivider: 50,
  /** Header bar */
  header: 100,
  /** Navigation sidebar */
  navigation: 100,
  /** Dropdowns and menus */
  dropdown: 200,
  /** Modal backdrop */
  modalBackdrop: 400,
  /** Modal content */
  modal: 500,
  /** Portrait blocker overlay */
  orientationBlocker: 99999,
} as const;

// ============================================================================
// TABLET ANIMATION DURATIONS
// ============================================================================

/**
 * Animation timing for tablet interactions
 */
export const TABLET_ANIMATIONS = {
  /** Fast animations (75ms) */
  fast: 75,
  /** Normal animations (150ms) */
  normal: 150,
  /** Slow animations (300ms) */
  slow: 300,
  /** Panel collapse/expand (200ms) */
  panelTransition: 200,
  /** Orientation change transition (200ms) */
  orientationTransition: 200,
} as const;

// ============================================================================
// TABLET COLORS (Re-export common colors)
// ============================================================================

export { 
  POSITION_COLORS, 
  BG_COLORS, 
  TEXT_COLORS,
  BRAND_COLORS,
  NAVBAR_BLUE,
  STATE_COLORS,
} from './colors';

