/**
 * VX2 Draft Room Constants
 * 
 * Draft-specific constants. Imports from VX2 core for colors/sizes.
 * No dependencies on VX.
 */

import { SPACING, RADIUS, TYPOGRAPHY, TOUCH_TARGETS } from '../../core/constants/sizes';
import { STATE_COLORS, POSITION_COLORS, BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';

// ============================================================================
// DRAFT SETTINGS DEFAULTS
// ============================================================================

/**
 * Default draft configuration
 */
export const DRAFT_DEFAULTS = {
  /** Standard team count */
  teamCount: 12,
  /** Standard roster size for best ball */
  rosterSize: 18,
  /** Normal pick time in seconds */
  pickTimeSeconds: 30,
  /** Grace period before auto-pick */
  gracePeriodSeconds: 5,
  /** Fast mode pick time (for testing/mock drafts) */
  fastModeSeconds: 3,
} as const;

/**
 * Total picks in a standard draft
 */
export const TOTAL_PICKS = DRAFT_DEFAULTS.teamCount * DRAFT_DEFAULTS.rosterSize; // 216

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

/**
 * Draft room layout measurements
 */
export const DRAFT_LAYOUT = {
  // Navbar (content height only - safe area inset added separately)
  navbarHeight: 48,
  navbarPaddingX: SPACING.md,
  
  // Picks Bar
  picksBarHeight: 200,
  pickCardWidth: 140,
  pickCardHeight: 172,
  pickCardGap: SPACING.sm,
  picksBarPaddingX: SPACING.md,
  picksBarPaddingY: SPACING.sm,
  
  // Player List
  playerRowHeight: 64,
  playerRowPaddingX: SPACING.md,
  filterBarHeight: 48,
  filterButtonWidth: 64,
  searchBarHeight: 44,
  
  // Queue
  queueItemHeight: 56,
  queueDragHandleWidth: 32,
  
  // Roster
  rosterRowHeight: 48,
  participantSelectorHeight: 44,
  
  // Board
  boardCellWidth: 72,
  boardCellHeight: 64,
  boardHeaderHeight: 32,
  
  // Footer
  footerHeight: 56,
  footerIconSize: 24,
} as const;

// ============================================================================
// TIMER CONSTANTS
// ============================================================================

/**
 * Timer color thresholds and colors
 */
export const TIMER_CONFIG = {
  /** Seconds remaining when warning state triggers */
  warningThreshold: 10,
  /** Seconds remaining when critical state triggers */
  criticalThreshold: 5,

  /** Timer colors by state */
  colors: {
  normal: STATE_COLORS.active,
  warning: STATE_COLORS.warning,
  critical: STATE_COLORS.error,
  },
} as const;

// ============================================================================
// POSITION LIMITS (Best Ball)
// ============================================================================

/**
 * Recommended position limits for best ball
 */
export const POSITION_LIMITS = {
  QB: { min: 1, max: 3, recommended: 2 },
  RB: { min: 4, max: 7, recommended: 5 },
  WR: { min: 5, max: 8, recommended: 6 },
  TE: { min: 1, max: 3, recommended: 2 },
} as const;

// ============================================================================
// POSITION COLORS (Re-export from core)
// ============================================================================

/**
 * Position colors - re-exported for convenience
 * These are locked per memory #4753963
 */
export { POSITION_COLORS } from '../../core/constants/colors';

// ============================================================================
// UI CONSTANTS
// ============================================================================

/**
 * Tab configuration for footer
 */
export const DRAFT_TABS = [
  { id: 'players', label: 'Players', icon: 'user' },
  { id: 'queue', label: 'Queue', icon: 'plus' },
  { id: 'rosters', label: 'Rosters', icon: 'list' },
  { id: 'board', label: 'Board', icon: 'grid' },
  { id: 'info', label: 'Info', icon: 'info' },
] as const;

/**
 * Sort options for player list
 */
export const SORT_OPTIONS = [
  { id: 'adp-asc', label: 'ADP (Low to High)' },
  { id: 'adp-desc', label: 'ADP (High to Low)' },
  { id: 'name-asc', label: 'Name (A-Z)' },
  { id: 'name-desc', label: 'Name (Z-A)' },
  { id: 'proj-asc', label: 'Projection (Low to High)' },
  { id: 'proj-desc', label: 'Projection (High to Low)' },
] as const;

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

/**
 * Animation durations for draft room
 */
export const DRAFT_ANIMATIONS = {
  /** Pick card transition */
  pickTransition: 200,
  /** Tab switch transition */
  tabTransition: 150,
  /** Player row expand/collapse */
  rowExpand: 200,
  /** Timer pulse when critical */
  timerPulse: 500,
} as const;

// ============================================================================
// MOCK DATA FLAGS
// ============================================================================

/**
 * Development flags
 */
export const DEV_FLAGS = {
  /** Use mock data instead of Firebase */
  useMockData: true,
  /** Enable debug logging */
  debugLogging: true,
  /** Show dev tools overlay */
  showDevTools: false,
} as const;

// ============================================================================
// BACKGROUND STYLES
// ============================================================================

/**
 * Reusable tiled background image style
 * Use with spread operator: style={{ ...TILED_BG_STYLE, ...otherStyles }}
 */
export const TILED_BG_STYLE = {
  backgroundImage: 'url(/wr_blue.png)',
  backgroundRepeat: 'repeat',
  backgroundSize: '60px 60px', // Smaller tile size for cards
  backgroundColor: '#1E3A5F', // Fallback color
} as const;

/**
 * Tiled background as CSS string (for inline style composition)
 */
export const TILED_BG_CSS = `
  background-image: url(/wr_blue.png);
  background-repeat: repeat;
  background-size: 200px 200px;
  background-color: #1E3A5F;
`;
