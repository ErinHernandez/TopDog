/**
 * VX2 Core Constants
 * 
 * Barrel exports for all constants.
 */

// Tab configuration
export {
  TAB_REGISTRY,
  TAB_ORDER,
  DEFAULT_TAB,
  PATH_TO_TAB,
  getOrderedTabs,
  getTabConfig,
  getTabFromPath,
  getPathFromTab,
} from './tabs';

// Colors
export {
  POSITION_COLORS,
  getPositionColor,
  BRAND_COLORS,
  BG_COLORS,
  TEXT_COLORS,
  BORDER_COLORS,
  STATE_COLORS,
  TAB_BAR_COLORS,
  HEADER_COLORS,
  UI_COLORS,
  MODAL_THEME_LEAVE_CONFIRM,
  MODAL_THEME_NAVIGATE_AWAY_ALERTS,
  DRAFT_FOOTER_THEME,
  LOBBY_THEME,
  DRAFT_LIST_THEME,
  DRAFT_BOARD_THEME,
  PICKS_BAR_THEME,
  ROSTER_THEME,
  SHARE_OPTIONS_THEME,
  PLAYER_STATS_THEME,
  PAYMONGO_DEPOSIT_THEME,
  NFL_TEAM_COLORS,
  getTeamColors,
} from './colors';
export type { PositionColorKey } from './colors';

// Sizes
export {
  TOUCH_TARGETS,
  Z_INDEX,
  HEADER,
  TAB_BAR,
  CONTENT,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  BREAKPOINTS,
  PHONE_FRAME,
  SAFE_AREA,
  DURATION,
  EASING,
  DEVICE_PRESETS,
  DEFAULT_DEVICE,
  ALL_DEVICES,
} from './sizes';
export type { DevicePresetId, DevicePreset } from './sizes';

// Responsive constants
export {
  DEVICE_CLASSIFICATIONS,
  RESPONSIVE_SCALE,
  getDeviceClass,
  getDeviceClassFromPreset,
  getResponsiveScale,
  getScaleFactor,
  getResponsiveCSSVars,
} from './responsive';
export type { DeviceClass, DeviceClassification, ResponsiveScale } from './responsive';

