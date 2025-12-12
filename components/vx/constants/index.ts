/**
 * VX Constants - Central Export
 * 
 * Import all constants from here:
 * import { POSITION_COLORS, MOBILE, POSITIONS } from '@/components/vx/constants';
 */

// Colors
export {
  POSITION_COLORS,
  BRAND_COLORS,
  BG_COLORS,
  TEXT_COLORS,
  BORDER_COLORS,
  STATE_COLORS,
  UI_COLORS,
  NFL_TEAM_COLORS,
  getPositionColor,
  getTeamColors,
} from './colors';

export type { PositionColorKey } from './colors';

// Sizes
export {
  TOUCH_TARGETS,
  MOBILE,
  TABLET,
  DESKTOP,
  SPACING,
  TYPOGRAPHY,
  FONT_SIZE,
  BREAKPOINTS,
  PLATFORM,
  Z_INDEX,
} from './sizes';

// Animations
export {
  DURATION,
  DURATION_MS,
  EASING,
  TRANSITION,
  KEYFRAMES,
  ANIMATION_CLASSES,
  prefersReducedMotion,
  getAnimationDuration,
} from './animations';

// Positions
export {
  POSITIONS,
  FLEX_POSITIONS,
  FILTER_POSITIONS,
  STARTING_LINEUP,
  BENCH_SPOTS,
  ROSTER_SIZE,
  ROSTER_REQUIREMENTS,
  POSITION_CONFIG,
  SORT_OPTIONS,
  isFlexEligible,
  getPositionConfig,
  filterByPosition,
} from './positions';

export type {
  FantasyPosition,
  RosterPosition,
  AllPositions,
  PositionConfig,
  SortDirection,
  SortField,
  SortOption,
} from './positions';

