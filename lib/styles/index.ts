/**
 * Styles Library Index
 *
 * Re-exports all style utilities for convenient importing.
 *
 * @example
 * import { cn, cssVar, spacing, color } from '@/lib/styles';
 * import { positionTextClass, teamDataAttr } from '@/lib/styles';
 */

// Class name utilities
export { cn, createVariants, mergeStyles, classes } from './classNames';
export { default as classNames } from './classNames';

// CSS variable utilities
export {
  // Token functions
  spacing,
  color,
  bg,
  text,
  border,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  zIndex,
  gray,
  positionColor,
  positionBg,
  positionEndColor,
  // CSS variable helpers
  cssVar,
  cssVars,
  // Gradient helpers
  positionGradient,
  positionGradientVertical,
  // Transition helpers
  transition,
  duration,
  ease,
} from './cssVariables';

// Re-export types from cssVariables that aren't in types.ts
export type { ColorToken, PositionCode } from './cssVariables';

// Token utilities (new - for static CSS class patterns)
export {
  // Position class helpers
  positionTextClass,
  positionBgClass,
  positionBadgeClass,
  positionGradientClass,
  positionBorderClass,
  positionBorderLeftClass,
  // Team class helpers
  teamDataAttr,
  teamBgClass,
  teamTextClass,
  // Pixel value getters (for calculations)
  spacingPx,
  fontSizePx,
  touchTargetPx,
  zIndexValue,
  // Backward compatibility exports
  POSITION_COLORS,
  BRAND_COLORS,
  BG_COLORS,
  TEXT_COLORS,
  NFL_TEAM_COLORS,
  getPositionColor,
  getTeamColors,
} from './tokens';

// Lazy loading utilities (for performance optimization)
export {
  lazyComponent,
  preloadRouteStyles,
  loadStylesOnDemand,
  loadStylesOnVisible,
  getCriticalCSSPath,
} from './lazyStyles';

// Comprehensive type definitions
export type {
  // Spacing
  SpacingScale,
  SpacingToken,
  TouchTargetToken,
  // Colors
  Position,
  ColoredPosition,
  NFLTeam,
  BrandColor,
  GrayToken,
  BgToken,
  TextToken,
  BorderToken,
  StateColor,
  // Typography
  FontSizeToken,
  FontWeightToken,
  LineHeightToken,
  // Layout
  RadiusToken,
  ZIndexToken,
  ShadowToken,
  // Animation
  DurationToken,
  EasingToken,
  TransitionToken,
  // CSS utilities
  CSSVariable,
  CSSVariableStyle,
  ClampValue,
  // Component-specific
  DeviceSizeToken,
  StatsTablePosition,
  // Utility types
  WithCSSVariables,
  TokenName,
  CSSValue,
} from './types';

// Type guards
export {
  isPosition,
  isColoredPosition,
  isNFLTeam,
} from './types';
