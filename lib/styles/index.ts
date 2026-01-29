/**
 * Styles Library Index
 *
 * Re-exports all style utilities for convenient importing.
 *
 * @example
 * import { cn, cssVar, spacing, color } from '@/lib/styles';
 */

// Class name utilities
export { cn, createVariants, mergeStyles, classes } from './classNames';
export { default as classNames } from './classNames';

// CSS variable utilities
export {
  // Token types
  type SpacingToken,
  type ColorToken,
  type BgToken,
  type TextToken,
  type BorderToken,
  type FontSizeToken,
  type FontWeightToken,
  type LineHeightToken,
  type RadiusToken,
  type ZIndexToken,
  type PositionCode,
  type GrayToken,
  type CSSVariableStyle,
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
