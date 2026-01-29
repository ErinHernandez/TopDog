/**
 * CSS Custom Property Utilities
 *
 * Type-safe helpers for working with CSS custom properties.
 * These utilities provide a bridge between TypeScript constants
 * and CSS custom properties for CSP-compliant dynamic styling.
 *
 * @example
 * // Using token functions
 * const styles = { padding: spacing('lg'), color: color('primary') };
 *
 * // Using cssVar for dynamic values
 * <div style={cssVar('progress', `${value}%`)} />
 *
 * // Using cssVars for multiple variables
 * <div style={cssVars({ progress: '50%', color: 'red' })} />
 */

// ============================================================================
// TOKEN TYPES
// ============================================================================

/** Spacing tokens from --spacing-* variables */
export type SpacingToken =
  | '2xs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl';

/** Color tokens from --color-* variables */
export type ColorToken =
  | 'brand-primary'
  | 'brand-secondary'
  | 'brand-accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'active'
  | 'selected'
  | 'hover';

/** Background color tokens from --bg-* variables */
export type BgToken =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'elevated'
  | 'card'
  | 'black';

/** Text color tokens from --text-* variables */
export type TextToken = 'primary' | 'secondary' | 'muted' | 'disabled';

/** Border color tokens from --border-* variables */
export type BorderToken =
  | 'default'
  | 'light'
  | 'subtle'
  | 'focus'
  | 'error'
  | 'success';

/** Font size tokens from --font-size-* variables */
export type FontSizeToken =
  | '2xs'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl';

/** Font weight tokens from --font-weight-* variables */
export type FontWeightToken = 'normal' | 'medium' | 'semibold' | 'bold';

/** Line height tokens from --line-height-* variables */
export type LineHeightToken = 'tight' | 'snug' | 'normal' | 'relaxed';

/** Border radius tokens from --radius-* variables */
export type RadiusToken = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/** Z-index tokens from --z-* variables */
export type ZIndexToken =
  | 'base'
  | 'elevated'
  | 'sticky-content'
  | 'dropdown'
  | 'header'
  | 'tab-bar'
  | 'sticky'
  | 'fixed'
  | 'modal-backdrop'
  | 'modal'
  | 'popover'
  | 'tooltip'
  | 'toast'
  | 'max';

/** Position codes for fantasy positions */
export type PositionCode = 'QB' | 'RB' | 'WR' | 'TE' | 'BN';

/** Gray scale tokens */
export type GrayToken =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

// ============================================================================
// CSS VARIABLE GENERATORS
// ============================================================================

/**
 * Get spacing CSS variable
 * @example spacing('lg') => 'var(--spacing-lg)'
 */
export const spacing = (token: SpacingToken): string =>
  `var(--spacing-${token})`;

/**
 * Get color CSS variable
 * @example color('success') => 'var(--color-success)'
 */
export const color = (token: ColorToken): string => `var(--color-${token})`;

/**
 * Get background color CSS variable
 * @example bg('primary') => 'var(--bg-primary)'
 */
export const bg = (token: BgToken): string => `var(--bg-${token})`;

/**
 * Get text color CSS variable
 * @example text('secondary') => 'var(--text-secondary)'
 */
export const text = (token: TextToken): string => `var(--text-${token})`;

/**
 * Get border color CSS variable
 * @example border('focus') => 'var(--border-focus)'
 */
export const border = (token: BorderToken): string =>
  `var(--border-${token})`;

/**
 * Get font size CSS variable
 * @example fontSize('lg') => 'var(--font-size-lg)'
 */
export const fontSize = (token: FontSizeToken): string =>
  `var(--font-size-${token})`;

/**
 * Get font weight CSS variable
 * @example fontWeight('bold') => 'var(--font-weight-bold)'
 */
export const fontWeight = (token: FontWeightToken): string =>
  `var(--font-weight-${token})`;

/**
 * Get line height CSS variable
 * @example lineHeight('normal') => 'var(--line-height-normal)'
 */
export const lineHeight = (token: LineHeightToken): string =>
  `var(--line-height-${token})`;

/**
 * Get border radius CSS variable
 * @example radius('lg') => 'var(--radius-lg)'
 */
export const radius = (token: RadiusToken): string => `var(--radius-${token})`;

/**
 * Get z-index CSS variable
 * @example zIndex('modal') => 'var(--z-modal)'
 */
export const zIndex = (token: ZIndexToken): string => `var(--z-${token})`;

/**
 * Get gray scale CSS variable
 * @example gray('700') => 'var(--gray-700)'
 */
export const gray = (token: GrayToken): string => `var(--gray-${token})`;

/**
 * Get position color CSS variable
 * @example positionColor('QB') => 'var(--color-position-qb)'
 */
export const positionColor = (position: PositionCode): string =>
  `var(--color-position-${position.toLowerCase()})`;

/**
 * Get position background color CSS variable (30% opacity)
 * @example positionBg('RB') => 'var(--color-position-rb-bg)'
 */
export const positionBg = (position: PositionCode): string =>
  `var(--color-position-${position.toLowerCase()}-bg)`;

/**
 * Get position gradient end color CSS variable
 * @example positionEndColor('WR') => 'var(--color-position-wr-end)'
 */
export const positionEndColor = (position: PositionCode): string =>
  `var(--color-position-${position.toLowerCase()}-end)`;

// ============================================================================
// DYNAMIC CSS VARIABLE HELPERS
// ============================================================================

/**
 * CSS variable style object type
 * Allows setting CSS custom properties in React style props
 */
export interface CSSVariableStyle {
  [key: `--${string}`]: string | number;
}

/**
 * Create a single CSS variable style object
 * @example cssVar('progress', '50%') => { '--progress': '50%' }
 */
export const cssVar = (
  name: string,
  value: string | number
): CSSVariableStyle => ({
  [`--${name}`]: value,
});

/**
 * Create multiple CSS variable style objects
 * @example cssVars({ progress: '50%', opacity: 0.8 })
 *          => { '--progress': '50%', '--opacity': 0.8 }
 */
export const cssVars = (
  vars: Record<string, string | number>
): CSSVariableStyle => {
  const result: CSSVariableStyle = {};
  for (const [key, value] of Object.entries(vars)) {
    result[`--${key}`] = value;
  }
  return result;
};

// ============================================================================
// GRADIENT HELPERS
// ============================================================================

/**
 * Create a position gradient CSS value
 * @example positionGradient('QB') => 'linear-gradient(135deg, var(--color-position-qb) 0%, var(--color-position-qb-end) 100%)'
 */
export const positionGradient = (position: PositionCode): string =>
  `linear-gradient(135deg, var(--color-position-${position.toLowerCase()}) 0%, var(--color-position-${position.toLowerCase()}-end) 100%)`;

/**
 * Create a vertical position gradient CSS value (for queue)
 * @example positionGradientVertical('RB') => 'linear-gradient(180deg, ...)'
 */
export const positionGradientVertical = (position: PositionCode): string =>
  `linear-gradient(180deg, var(--color-position-${position.toLowerCase()}) 0%, var(--color-position-${position.toLowerCase()}-end) 100%)`;

// ============================================================================
// TRANSITION HELPERS
// ============================================================================

/**
 * Get a transition CSS variable
 * @example transition('normal') => 'var(--transition-normal)'
 */
export const transition = (
  type: 'fast' | 'normal' | 'slow' | 'colors' | 'transform' | 'opacity'
): string => `var(--transition-${type})`;

/**
 * Get a duration CSS variable
 * @example duration('slow') => 'var(--duration-slow)'
 */
export const duration = (type: 'fast' | 'normal' | 'slow' | 'page'): string =>
  `var(--duration-${type})`;

/**
 * Get an easing CSS variable
 * @example ease('spring') => 'var(--ease-spring)'
 */
export const ease = (
  type: 'default' | 'in' | 'out' | 'in-out' | 'spring'
): string => `var(--ease-${type})`;
