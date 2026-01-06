/**
 * Timing Constants
 * 
 * Centralized timing values used throughout the VX2 application.
 * All values are in milliseconds unless otherwise noted.
 * 
 * @module components/vx2/core/constants/timing
 */

/**
 * Update throttling intervals
 */
export const UPDATE_THROTTLE_MS = 1000; // 1 second

/**
 * Draft timer constants
 */
export const DRAFT_TIMER = {
  /** Delay before timer expires (grace period) */
  EXPIRE_DELAY_MS: 1200,
  /** Grace period after shake animation before auto-pick */
  GRACE_PERIOD_MS: 600,
} as const;

/**
 * Animation durations
 */
export const ANIMATION = {
  /** Base animation duration */
  BASE_DURATION_MS: 300,
  /** Minimum visible duration for animations */
  MIN_DURATION_MS: 50,
  /** Nearly instant duration for reduced motion */
  DISABLED_DURATION_MS: 0.01,
} as const;

/**
 * Session management
 */
export const SESSION = {
  /** Remember me duration: 30 days */
  REMEMBER_ME_DURATION_MS: 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * UI component sizes (in pixels)
 */
export const UI_SIZES = {
  /** Status bar height for unified header */
  STATUS_BAR_HEIGHT: 28,
  /** Standard button size */
  BUTTON_SIZE: 44,
  /** Standard button ring size */
  BUTTON_RING_SIZE: 48,
} as const;

/**
 * Virtualization constants
 */
export const VIRTUALIZATION = {
  /** Height of each row in virtualized list */
  ROW_HEIGHT: 40,
  /** Approximate height of expanded card */
  EXPANDED_CARD_HEIGHT: 280,
  /** Number of rows to render outside visible area */
  OVERSCAN_COUNT: 5,
  /** Don't virtualize lists smaller than this */
  MIN_VIRTUALIZATION_THRESHOLD: 50,
} as const;

/**
 * Draft tutorial constants
 */
export const DRAFT_TUTORIAL = {
  /** Cell width in tutorial */
  CELL_WIDTH: 76,
  /** Gap between cells */
  CELL_GAP: 2,
} as const;

/**
 * Tablet layout constants
 */
export const TABLET_LAYOUT = {
  /** 30 days in milliseconds */
  THIRTY_DAYS_MS: 30 * 24 * 60 * 60 * 1000,
} as const;

