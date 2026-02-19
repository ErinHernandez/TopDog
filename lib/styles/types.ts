/**
 * CSS Token Type Definitions
 *
 * Complete TypeScript coverage for all design tokens.
 * Import these types for type-safe styling throughout the app.
 *
 * @example
 * import type { SpacingScale, ColorScale, Position } from '@/lib/styles/types';
 */

// ============================================================================
// SPACING TOKENS
// ============================================================================

/** All available spacing values */
export type SpacingScale =
  | '0'
  | 'px'
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '14'
  | '16'
  | '20'
  | '24'
  | '28'
  | '32'
  | '36'
  | '40'
  | '44'
  | '48'
  | '52'
  | '56'
  | '60'
  | '64'
  | '72'
  | '80'
  | '96';

/** Semantic spacing tokens */
export type SpacingToken =
  | '2xs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

/** Touch target sizes (Apple HIG compliant) */
export type TouchTargetToken =
  | 'touch-min'      // 44px - Apple HIG minimum
  | 'touch-sm'       // 36px - Small (caution)
  | 'touch-md'       // 44px - Standard
  | 'touch-lg'       // 48px - Comfortable
  | 'touch-xl';      // 56px - Large

// ============================================================================
// COLOR TOKENS
// ============================================================================

/** Fantasy football positions */
export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | 'FLEX';

/** Positions with assigned colors (excludes K, DEF, FLEX) */
export type ColoredPosition = 'QB' | 'RB' | 'WR' | 'TE';

/** NFL team abbreviations */
export type NFLTeam =
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI' | 'CIN' | 'CLE'
  | 'DAL' | 'DEN' | 'DET' | 'GB'  | 'HOU' | 'IND' | 'JAX' | 'KC'
  | 'LAC' | 'LAR' | 'LV'  | 'MIA' | 'MIN' | 'NE'  | 'NO'  | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SF'  | 'SEA' | 'TB'  | 'TEN' | 'WAS';

/** Brand color tokens */
export type BrandColor =
  | 'primary'
  | 'accent'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

/** Gray scale tokens */
export type GrayToken =
  | '50'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | '950';

/** Background color tokens */
export type BgToken =
  | 'app'
  | 'surface'
  | 'elevated'
  | 'overlay'
  | 'navbar'
  | 'card';

/** Text color tokens */
export type TextToken =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'disabled'
  | 'inverse';

/** Border color tokens */
export type BorderToken =
  | 'default'
  | 'light'
  | 'focus'
  | 'error';

/** State color tokens */
export type StateColor =
  | 'hover'
  | 'active'
  | 'focus'
  | 'disabled'
  | 'selected';

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

/** Font size scale */
export type FontSizeToken =
  | '2xs'  // 10px
  | 'xs'   // 12px
  | 'sm'   // 14px
  | 'base' // 16px
  | 'lg'   // 18px
  | 'xl'   // 20px
  | '2xl'  // 24px
  | '3xl'  // 30px
  | '4xl'; // 36px

/** Font weight values */
export type FontWeightToken =
  | 'normal'    // 400
  | 'medium'    // 500
  | 'semibold'  // 600
  | 'bold';     // 700

/** Line height values */
export type LineHeightToken =
  | 'none'     // 1
  | 'tight'    // 1.25
  | 'snug'     // 1.375
  | 'normal'   // 1.5
  | 'relaxed'  // 1.625
  | 'loose';   // 2

// ============================================================================
// LAYOUT TOKENS
// ============================================================================

/** Border radius values */
export type RadiusToken =
  | 'none'  // 0
  | 'sm'    // 4px
  | 'md'    // 8px
  | 'lg'    // 12px
  | 'xl'    // 16px
  | '2xl'   // 24px
  | 'full'; // 9999px

/** Z-index scale */
export type ZIndexToken =
  | 'base'           // 0
  | 'elevated'       // 10
  | 'sticky-content' // 20
  | 'dropdown'       // 100
  | 'header'         // 150
  | 'tab-bar'        // 150
  | 'sticky'         // 200
  | 'fixed'          // 300
  | 'modal-backdrop' // 400
  | 'modal'          // 500
  | 'popover'        // 600
  | 'tooltip'        // 700
  | 'toast'          // 800
  | 'max';           // 9999

/** Shadow values */
export type ShadowToken =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

/** Duration values */
export type DurationToken =
  | 'instant'  // 0ms
  | 'fast'     // 150ms
  | 'normal'   // 200ms
  | 'slow'     // 300ms
  | 'slower';  // 500ms

/** Easing functions */
export type EasingToken =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring';

/** Transition presets */
export type TransitionToken =
  | 'colors'
  | 'opacity'
  | 'shadow'
  | 'transform'
  | 'all';

// ============================================================================
// CSS VARIABLE TYPES
// ============================================================================

/** CSS custom property value */
export type CSSVariable = `var(--${string})`;

/** Style object with CSS variables */
export type CSSVariableStyle = {
  [key: `--${string}`]: string | number;
};

/** CSS clamp value for fluid sizing */
export type ClampValue = `clamp(${string}, ${string}, ${string})`;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

/** VX2 device sizing tokens */
export type DeviceSizeToken =
  | 'title-size'
  | 'title-line-height'
  | 'label-size'
  | 'value-size'
  | 'button-text-size'
  | 'progress-label-size'
  | 'card-padding'
  | 'section-gap'
  | 'element-gap'
  | 'logo-bar-height'
  | 'logo-height'
  | 'button-height'
  | 'image-max-size'
  | 'progress-height'
  | 'stats-row-height';

/** Stats table position layouts */
export type StatsTablePosition = 'qb' | 'rb' | 'wr' | 'te' | 'default';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Make all properties in T use CSS variables */
export type WithCSSVariables<T extends Record<string, unknown>> = {
  [K in keyof T]: CSSVariable;
};

/** Extract token names from a token type */
export type TokenName<T extends string> = T;

/** CSS property with optional !important */
export type CSSValue<T extends string | number> = T | `${T} !important`;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a string is a valid position code
 */
export function isPosition(value: string): value is Position {
  return ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'FLEX'].includes(value.toUpperCase());
}

/**
 * Check if a position has an assigned color
 */
export function isColoredPosition(value: string): value is ColoredPosition {
  return ['QB', 'RB', 'WR', 'TE'].includes(value.toUpperCase());
}

/**
 * Check if a string is a valid NFL team abbreviation
 */
export function isNFLTeam(value: string): value is NFLTeam {
  const teams = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
  ];
  return teams.includes(value.toUpperCase());
}
