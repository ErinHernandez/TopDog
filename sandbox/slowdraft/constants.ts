/**
 * Slow Drafts Constants
 *
 * Design tokens and configuration specific to the slow drafts experience.
 * Aligned with Draft Room visual language.
 */

import { SPACING, RADIUS, TYPOGRAPHY } from './deps/core/constants/sizes';
import { POSITION_COLORS, TEXT_COLORS, STATE_COLORS, BG_COLORS } from './deps/core/constants/colors';

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const SLOW_DRAFT_LAYOUT = {
  // Card dimensions
  cardPaddingX: SPACING.lg,
  cardPaddingY: SPACING.md + 2,
  cardBorderRadius: RADIUS.xl,
  cardGap: SPACING.md,

  // Collapsed card
  collapsedHeight: 156,

  // Expanded card
  expandedMinHeight: 360,

  // Roster strip
  rosterSquareSize: 20,
  rosterSquareGap: 3,
  rosterSquareBorderRadius: 4,

  // Expanded roster
  expandedPlayerCardWidth: 112,
  expandedPlayerCardHeight: 136,
  expandedPlayerCardGap: 8,

  // Section spacing
  sectionGap: SPACING.md,
  sectionLabelMarginBottom: SPACING.sm,

  // Filter bar
  filterBarHeight: 44,
  filterPillPadding: SPACING.sm,

  // List
  listPaddingX: SPACING.lg,
  listPaddingY: SPACING.sm,
} as const;

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

export const SLOW_DRAFT_COLORS = {
  // Position colors (from design system)
  positions: {
    QB: POSITION_COLORS.QB,
    RB: POSITION_COLORS.RB,
    WR: POSITION_COLORS.WR,
    TE: POSITION_COLORS.TE,
    empty: '#374151',
    emptyBorder: '#4B5563',
  },

  // Card states
  card: {
    default: BG_COLORS.secondary,
    defaultBorder: 'rgba(255,255,255,0.10)',
    yourTurn: 'tiled', // Uses TILED_BG_STYLE
    yourTurnBorder: 'rgba(255,255,255,0.35)',
    urgent: '#7f1d1d', // Deep red for < 30min
    urgentBorder: '#991b1b',
  },

  // Notable events
  events: {
    reach: '#F59E0B',      // Amber - overpaid
    reachBg: 'rgba(245, 158, 11, 0.15)',
    steal: '#10B981',      // Green - good value
    stealBg: 'rgba(16, 185, 129, 0.15)',
    alert: '#EF4444',      // Red - queue taken
    alertBg: 'rgba(239, 68, 68, 0.15)',
    positionRun: '#8B5CF6', // Purple
    positionRunBg: 'rgba(139, 92, 246, 0.15)',
    info: TEXT_COLORS.muted,
  },

  // Draft health score
  health: {
    excellent: '#10B981',  // 80-100
    good: '#3B82F6',       // 60-79
    fair: '#F59E0B',       // 40-59
    poor: '#EF4444',       // 0-39
  },

  // Needs urgency
  needs: {
    critical: '#EF4444',   // Below minimum
    warning: '#F59E0B',    // Approaching minimum
    good: '#10B981',       // Met requirements
    neutral: TEXT_COLORS.muted,
  },

  // Timer states
  timer: {
    normal: TEXT_COLORS.primary,
    warning: '#F59E0B',    // < 2 hours
    critical: '#EF4444',   // < 30 minutes
  },
} as const;

// ============================================================================
// TYPOGRAPHY CONSTANTS
// ============================================================================

export const SLOW_DRAFT_TYPOGRAPHY = {
  tournamentName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: '-0.01em',
    color: TEXT_COLORS.primary,
  },

  pickInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm - 1,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: TEXT_COLORS.secondary,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    color: TEXT_COLORS.muted,
  },

  playerName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: TEXT_COLORS.primary,
  },

  playerPosition: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: TEXT_COLORS.secondary,
  },

  eventDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.normal,
    color: TEXT_COLORS.secondary,
  },

  eventHighlight: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  needsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  timer: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontVariantNumeric: 'tabular-nums',
  },

  timerLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
  },
} as const;

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const SLOW_DRAFT_ANIMATIONS = {
  // Card expansion
  expandDuration: 250,
  expandEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Roster strip build
  rosterStaggerDelay: 30,
  rosterAnimationDuration: 150,

  // Timer pulse
  timerPulseDuration: 1000,

  // Event highlight
  eventHighlightDuration: 2000,

  // Card press
  pressScale: 0.98,
  pressDuration: 100,
} as const;

// ============================================================================
// THRESHOLD CONSTANTS
// ============================================================================

export const SLOW_DRAFT_THRESHOLDS = {
  // Timer urgency (in seconds)
  timerWarning: 7200,      // 2 hours
  timerCritical: 1800,     // 30 minutes

  // ADP delta for notable events
  reachThreshold: 15,      // Picks early = reach

  // Position run detection
  positionRunMinimum: 3,   // Consecutive same position

  // Health score thresholds
  healthExcellent: 80,
  healthGood: 60,
  healthFair: 40,

  // Activity feed
  maxRecentPicks: 10,
  maxNotableEvents: 5,

  // Expansion
  maxVisibleRosterExpanded: 6, // Show 6 + "more" button
} as const;

// ============================================================================
// POSITION REQUIREMENTS
// ============================================================================

export const POSITION_REQUIREMENTS = {
  QB: { min: 1, max: 3, recommended: 2 },
  RB: { min: 4, max: 7, recommended: 5 },
  WR: { min: 5, max: 8, recommended: 6 },
  TE: { min: 1, max: 3, recommended: 2 },
} as const;

// Total roster size
export const ROSTER_SIZE = 18;
export const TEAM_COUNT = 12;
export const TOTAL_ROUNDS = 18;

// ============================================================================
// SORT OPTIONS
// ============================================================================

export type SortOption =
  | 'picksUntilTurn'
  | 'timeRemaining'
  | 'draftProgress'
  | 'recentlyActive';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'picksUntilTurn', label: 'Picks Until Turn' },
  { value: 'timeRemaining', label: 'Time Remaining' },
  { value: 'draftProgress', label: 'Draft Progress' },
  { value: 'recentlyActive', label: 'Recently Active' },
];

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export type FilterOption =
  | 'all'
  | 'needsAttention';

export const FILTER_OPTIONS: { value: FilterOption; label: string; description: string }[] = [
  { value: 'all', label: 'All Drafts', description: 'Show all active slow drafts' },
  { value: 'needsAttention', label: 'Needs Attention', description: 'Urgent timer or position needs' },
];
