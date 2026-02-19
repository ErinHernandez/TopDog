/**
 * Design Token Utilities
 *
 * SINGLE SOURCE OF TRUTH integration layer.
 * All tokens are defined in /styles/tokens/_tokens.css
 * This file provides TypeScript types and helper functions.
 *
 * @see /styles/tokens/_tokens.css - CSS custom property definitions
 * @see /STYLING_ARCHITECTURE_PLAN.md - Architecture documentation
 */

// ============================================================================
// POSITION TYPES & UTILITIES
// ============================================================================

/** Fantasy football position codes */
export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'BN' | 'K' | 'DST' | 'DEF';

/** Positions that have dedicated colors */
export type ColoredPosition = 'QB' | 'RB' | 'WR' | 'TE' | 'BN';

/**
 * Get the CSS class for position text color
 * @example positionTextClass('QB') => 'text-position-qb'
 */
export const positionTextClass = (position: string): string =>
  `text-position-${position.toLowerCase()}`;

/**
 * Get the CSS class for position background color
 * @example positionBgClass('RB') => 'bg-position-rb'
 */
export const positionBgClass = (position: string): string =>
  `bg-position-${position.toLowerCase()}`;

/**
 * Get the CSS class for position badge
 * @example positionBadgeClass('WR') => 'badge-position-wr'
 */
export const positionBadgeClass = (position: string): string =>
  `badge-position-${position.toLowerCase()}`;

/**
 * Get the CSS class for position gradient
 * @example positionGradientClass('TE') => 'gradient-position-te'
 */
export const positionGradientClass = (position: string): string =>
  `gradient-position-${position.toLowerCase()}`;

/**
 * Get the CSS class for position border
 * @example positionBorderClass('QB') => 'border-position-qb'
 */
export const positionBorderClass = (position: string): string =>
  `border-position-${position.toLowerCase()}`;

/**
 * Get the CSS class for position left border accent
 * @example positionBorderLeftClass('RB') => 'border-l-position-rb'
 */
export const positionBorderLeftClass = (position: string): string =>
  `border-l-position-${position.toLowerCase()}`;

// ============================================================================
// NFL TEAM UTILITIES
// ============================================================================

/** NFL team abbreviation codes */
export type NFLTeam =
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI' | 'CIN' | 'CLE'
  | 'DAL' | 'DEN' | 'DET' | 'GB' | 'HOU' | 'IND' | 'JAX' | 'KC'
  | 'LV' | 'LAC' | 'LAR' | 'MIA' | 'MIN' | 'NE' | 'NO' | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SF' | 'SEA' | 'TB' | 'TEN' | 'WAS';

/**
 * Get data-team attribute props for team styling
 * @example teamDataAttr('KC') => { 'data-team': 'KC' }
 */
export const teamDataAttr = (team: string): { 'data-team': string } => ({
  'data-team': team.toUpperCase(),
});

/**
 * Get the CSS class for team primary background
 * @example teamBgClass('KC') => 'bg-team-kc-primary'
 */
export const teamBgClass = (team: string): string =>
  `bg-team-${team.toLowerCase()}-primary`;

/**
 * Get the CSS class for team text color
 * @example teamTextClass('KC') => 'text-team-kc'
 */
export const teamTextClass = (team: string): string =>
  `text-team-${team.toLowerCase()}`;

// ============================================================================
// SPACING TOKENS
// ============================================================================

/** Spacing scale tokens */
export type SpacingToken = '0' | 'px' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

/** Spacing values in pixels (for calculations) */
export const SPACING_VALUES: Record<SpacingToken, number> = {
  '0': 0,
  'px': 1,
  '2xs': 2,
  'xs': 4,
  'sm': 8,
  'md': 12,
  'lg': 16,
  'xl': 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

/**
 * Get spacing CSS variable
 * @example spacing('lg') => 'var(--spacing-lg)'
 */
export const spacing = (token: SpacingToken): string =>
  `var(--spacing-${token})`;

/**
 * Get spacing value in pixels (for calculations)
 * @example spacingPx('lg') => 16
 */
export const spacingPx = (token: SpacingToken): number =>
  SPACING_VALUES[token];

// ============================================================================
// COLOR TOKENS
// ============================================================================

/** State color tokens */
export type StateColorToken = 'success' | 'warning' | 'error' | 'info' | 'active' | 'selected' | 'hover';

/** Brand color tokens */
export type BrandColorToken = 'brand-primary' | 'brand-secondary' | 'brand-accent';

/** All color tokens */
export type ColorToken = StateColorToken | BrandColorToken;

/**
 * Get color CSS variable
 * @example color('success') => 'var(--color-success)'
 */
export const color = (token: ColorToken): string =>
  `var(--color-${token})`;

// ============================================================================
// BACKGROUND TOKENS
// ============================================================================

/** Background color tokens */
export type BgToken = 'primary' | 'secondary' | 'tertiary' | 'elevated' | 'card' | 'black';

/**
 * Get background CSS variable
 * @example bg('card') => 'var(--bg-card)'
 */
export const bg = (token: BgToken): string =>
  `var(--bg-${token})`;

// ============================================================================
// TEXT TOKENS
// ============================================================================

/** Text color tokens */
export type TextToken = 'primary' | 'secondary' | 'muted' | 'disabled';

/**
 * Get text color CSS variable
 * @example text('secondary') => 'var(--text-secondary)'
 */
export const text = (token: TextToken): string =>
  `var(--text-${token})`;

// ============================================================================
// BORDER TOKENS
// ============================================================================

/** Border color tokens */
export type BorderToken = 'default' | 'light' | 'subtle' | 'focus' | 'error' | 'success';

/**
 * Get border color CSS variable
 * @example border('focus') => 'var(--border-focus)'
 */
export const border = (token: BorderToken): string =>
  `var(--border-${token})`;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

/** Font size tokens */
export type FontSizeToken = '2xs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

/** Font size values in pixels */
export const FONT_SIZE_VALUES: Record<FontSizeToken, number> = {
  '2xs': 10,
  'xs': 12,
  'sm': 14,
  'base': 16,
  'lg': 18,
  'xl': 20,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
  '5xl': 52,
};

/**
 * Get font size CSS variable
 * @example fontSize('lg') => 'var(--font-size-lg)'
 */
export const fontSize = (token: FontSizeToken): string =>
  `var(--font-size-${token})`;

/**
 * Get font size value in pixels
 * @example fontSizePx('lg') => 18
 */
export const fontSizePx = (token: FontSizeToken): number =>
  FONT_SIZE_VALUES[token];

/** Font weight tokens */
export type FontWeightToken = 'normal' | 'medium' | 'semibold' | 'bold';

/**
 * Get font weight CSS variable
 * @example fontWeight('bold') => 'var(--font-weight-bold)'
 */
export const fontWeight = (token: FontWeightToken): string =>
  `var(--font-weight-${token})`;

/** Line height tokens */
export type LineHeightToken = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

/**
 * Get line height CSS variable
 * @example lineHeight('normal') => 'var(--line-height-normal)'
 */
export const lineHeight = (token: LineHeightToken): string =>
  `var(--line-height-${token})`;

// ============================================================================
// RADIUS TOKENS
// ============================================================================

/** Border radius tokens */
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/**
 * Get border radius CSS variable
 * @example radius('lg') => 'var(--radius-lg)'
 */
export const radius = (token: RadiusToken): string =>
  `var(--radius-${token})`;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

/** Box shadow tokens */
export type ShadowToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'card' | 'elevated';

/**
 * Get box shadow CSS variable
 * @example shadow('card') => 'var(--shadow-card)'
 */
export const shadow = (token: ShadowToken): string =>
  `var(--shadow-${token})`;

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

/** Z-index tokens */
export type ZIndexToken =
  | 'base' | 'elevated' | 'sticky-content' | 'dropdown' | 'header'
  | 'tab-bar' | 'sticky' | 'fixed' | 'modal-backdrop' | 'modal'
  | 'popover' | 'tooltip' | 'toast' | 'max';

/** Z-index values */
export const Z_INDEX_VALUES: Record<ZIndexToken, number> = {
  'base': 0,
  'elevated': 10,
  'sticky-content': 20,
  'dropdown': 100,
  'header': 150,
  'tab-bar': 150,
  'sticky': 200,
  'fixed': 300,
  'modal-backdrop': 400,
  'modal': 500,
  'popover': 600,
  'tooltip': 700,
  'toast': 800,
  'max': 9999,
};

/**
 * Get z-index CSS variable
 * @example zIndex('modal') => 'var(--z-modal)'
 */
export const zIndex = (token: ZIndexToken): string =>
  `var(--z-${token})`;

/**
 * Get z-index value as number
 * @example zIndexValue('modal') => 500
 */
export const zIndexValue = (token: ZIndexToken): number =>
  Z_INDEX_VALUES[token];

// ============================================================================
// DURATION TOKENS
// ============================================================================

/** Animation duration tokens */
export type DurationToken = 'instant' | 'fast' | 'normal' | 'slow' | 'page';

/**
 * Get duration CSS variable
 * @example duration('normal') => 'var(--duration-normal)'
 */
export const duration = (token: DurationToken): string =>
  `var(--duration-${token})`;

// ============================================================================
// EASING TOKENS
// ============================================================================

/** Easing function tokens */
export type EasingToken = 'default' | 'in' | 'out' | 'in-out' | 'spring';

/**
 * Get easing CSS variable
 * @example ease('spring') => 'var(--ease-spring)'
 */
export const ease = (token: EasingToken): string =>
  `var(--ease-${token})`;

// ============================================================================
// TRANSITION TOKENS
// ============================================================================

/** Transition preset tokens */
export type TransitionToken = 'fast' | 'normal' | 'slow' | 'colors' | 'transform' | 'opacity' | 'all';

/**
 * Get transition CSS variable
 * @example transition('normal') => 'var(--transition-normal)'
 */
export const transition = (token: TransitionToken): string =>
  `var(--transition-${token})`;

// ============================================================================
// GRAY SCALE
// ============================================================================

/** Gray scale tokens */
export type GrayToken = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

/**
 * Get gray CSS variable
 * @example gray('700') => 'var(--gray-700)'
 */
export const gray = (token: GrayToken): string =>
  `var(--gray-${token})`;

// ============================================================================
// CSS VARIABLE HELPERS
// ============================================================================

/**
 * CSS variable style object type
 */
export interface CSSVariableStyle {
  [key: `--${string}`]: string | number;
}

/**
 * Create a single CSS variable style object
 * @example cssVar('progress', '50%') => { '--progress': '50%' }
 */
export const cssVar = (name: string, value: string | number): CSSVariableStyle => ({
  [`--${name}`]: value,
});

/**
 * Create multiple CSS variable style objects
 * @example cssVars({ progress: '50%', opacity: 0.8 }) => { '--progress': '50%', '--opacity': 0.8 }
 */
export const cssVars = (vars: Record<string, string | number>): CSSVariableStyle => {
  const result: CSSVariableStyle = {};
  for (const [key, value] of Object.entries(vars)) {
    result[`--${key}`] = value;
  }
  return result;
};

// ============================================================================
// TOUCH TARGETS
// ============================================================================

/** Touch target size tokens */
export type TouchTargetToken = 'min' | 'comfort' | 'large';

/** Touch target values in pixels */
export const TOUCH_TARGET_VALUES: Record<TouchTargetToken, number> = {
  'min': 44,
  'comfort': 48,
  'large': 56,
};

/**
 * Get touch target CSS variable
 * @example touchTarget('comfort') => 'var(--touch-target-comfort)'
 */
export const touchTarget = (token: TouchTargetToken): string =>
  `var(--touch-target-${token})`;

/**
 * Get touch target value in pixels
 * @example touchTargetPx('comfort') => 48
 */
export const touchTargetPx = (token: TouchTargetToken): number =>
  TOUCH_TARGET_VALUES[token];

// ============================================================================
// BACKWARD COMPATIBILITY - Position Colors
// These exports maintain compatibility with existing code that imports from
// /components/vx2/core/constants/colors.ts
// ============================================================================

/**
 * @deprecated Use positionTextClass() or CSS classes instead
 */
export const POSITION_COLORS = {
  QB: '#F472B6',
  RB: '#0fba80',
  WR: '#FBBF25',
  TE: '#7C3AED',
  FLEX: null as null,
  BN: '#6B7280',
} as const;

/**
 * @deprecated Use CSS variables or token functions instead
 */
export const BRAND_COLORS = {
  primary: '#2DE2C5',
  secondary: '#59c5bf',
  accent: '#04FBB9',
} as const;

/**
 * @deprecated Use CSS variables instead
 */
export const BG_COLORS = {
  primary: '#101927',
  secondary: '#1f2937',
  tertiary: '#111827',
  elevated: 'rgba(255, 255, 255, 0.1)',
  card: '#1f2833',
  black: '#000000',
} as const;

/**
 * @deprecated Use CSS variables instead
 */
export const TEXT_COLORS = {
  primary: '#ffffff',
  secondary: '#9ca3af',
  muted: '#6b7280',
  disabled: '#4b5563',
} as const;

/**
 * @deprecated Use teamDataAttr() with data-team attribute instead
 */
export const NFL_TEAM_COLORS: Record<string, [string, string]> = {
  'ARI': ['#97233F', '#000000'],
  'ATL': ['#A71930', '#000000'],
  'BAL': ['#241773', '#000000'],
  'BUF': ['#00338D', '#C60C30'],
  'CAR': ['#0085CA', '#101820'],
  'CHI': ['#0B162A', '#C83803'],
  'CIN': ['#FB4F14', '#000000'],
  'CLE': ['#311D00', '#FF3C00'],
  'DAL': ['#003594', '#869397'],
  'DEN': ['#FB4F14', '#002244'],
  'DET': ['#0076B6', '#B0B7BC'],
  'GB': ['#203731', '#FFB612'],
  'HOU': ['#03202F', '#A71930'],
  'IND': ['#002C5F', '#A2AAAD'],
  'JAX': ['#101820', '#D7A22A'],
  'KC': ['#E31837', '#FFB81C'],
  'LV': ['#000000', '#A5ACAF'],
  'LAC': ['#0080C6', '#FFC20E'],
  'LAR': ['#003594', '#FFA300'],
  'MIA': ['#008E97', '#FC4C02'],
  'MIN': ['#4F2683', '#FFC62F'],
  'NE': ['#002244', '#C60C30'],
  'NO': ['#101820', '#D3BC8D'],
  'NYG': ['#0B2265', '#C60C30'],
  'NYJ': ['#125740', '#000000'],
  'PHI': ['#004C54', '#A5ACAF'],
  'PIT': ['#101820', '#FFB612'],
  'SF': ['#AA0000', '#B3995D'],
  'SEA': ['#002244', '#69BE28'],
  'TB': ['#D50A0A', '#FF7900'],
  'TEN': ['#0C2340', '#4B92DB'],
  'WAS': ['#5A1414', '#FFB612'],
};

/**
 * @deprecated Use positionTextClass() instead
 */
export function getPositionColor(position: string): string {
  return POSITION_COLORS[position as keyof typeof POSITION_COLORS] || POSITION_COLORS.BN;
}

/**
 * @deprecated Use teamDataAttr() with data-team attribute instead
 */
export function getTeamColors(team: string): [string, string] {
  return NFL_TEAM_COLORS[team?.toUpperCase()] || ['#374151', '#1F2937'];
}
