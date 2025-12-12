/**
 * VX Color Constants
 * 
 * Centralized color definitions for Version X.
 * Position colors are LOCKED and must match original exactly.
 */

// ============================================================================
// POSITION COLORS (LOCKED - DO NOT CHANGE)
// ============================================================================

/**
 * Position colors - these are locked per memory #4753963
 * Any change to these values requires explicit user approval
 */
export const POSITION_COLORS = {
  QB: '#F472B6',  // Pink
  RB: '#0fba80',  // Green
  WR: '#FBBF25',  // Yellow/Gold
  TE: '#7C3AED',  // Purple
  FLEX: null,     // Uses gradient (RB + WR + TE)
  BN: '#6B7280',  // Gray (bench)
} as const;

export type PositionColorKey = keyof typeof POSITION_COLORS;

/**
 * Get color for a position
 */
export function getPositionColor(position: string): string {
  return POSITION_COLORS[position as PositionColorKey] || POSITION_COLORS.BN;
}

// ============================================================================
// BRAND COLORS
// ============================================================================

export const BRAND_COLORS = {
  primary: '#2DE2C5',      // Teal/Cyan
  secondary: '#59c5bf',    // Lighter teal
  accent: '#04FBB9',       // Bright teal
} as const;

// ============================================================================
// BACKGROUND COLORS
// ============================================================================

export const BG_COLORS = {
  primary: '#101927',      // Main dark background
  secondary: '#1f2937',    // Card backgrounds
  tertiary: '#111827',     // Darker sections
  elevated: 'rgba(255, 255, 255, 0.1)',  // Elevated surfaces
  card: '#1f2833',         // Player card background
} as const;

// ============================================================================
// TEXT COLORS
// ============================================================================

export const TEXT_COLORS = {
  primary: '#ffffff',
  secondary: '#9ca3af',
  muted: '#6b7280',
  disabled: '#4b5563',
} as const;

// ============================================================================
// BORDER COLORS
// ============================================================================

export const BORDER_COLORS = {
  default: 'rgba(255, 255, 255, 0.1)',
  focus: '#59c5bf',
  error: '#ef4444',
  success: '#10b981',
} as const;

// ============================================================================
// UI STATE COLORS
// ============================================================================

export const STATE_COLORS = {
  onTheClock: '#EF4444',   // Red for on-the-clock
  myTurn: '#EF4444',       // Red for user's turn
  active: '#3B82F6',       // Blue for active states
  userHighlight: '#3B82F6', // Blue for user's cells/picks
  selected: '#2DE2C5',     // Teal for selected
  hover: 'rgba(255, 255, 255, 0.1)',
} as const;

// ============================================================================
// COMMON UI COLORS
// ============================================================================

export const UI_COLORS = {
  // Gray scale (matching Tailwind gray)
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  
  // Queue button
  queueButtonBorder: '#6b7280',
  queueButtonActiveBorder: '#ffffff',
  queueButtonActiveBg: '#6b7280',
  
  // Progress bars
  progressBg: '#6B7280',
} as const;

// ============================================================================
// TEAM COLORS (for gradient backgrounds)
// ============================================================================

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
  'NYG': ['#0B2265', '#A71930'],
  'NYJ': ['#125740', '#000000'],
  'PHI': ['#004C54', '#A5ACAF'],
  'PIT': ['#FFB612', '#101820'],
  'SF': ['#AA0000', '#B3995D'],
  'SEA': ['#002244', '#69BE28'],
  'TB': ['#D50A0A', '#FF7900'],
  'TEN': ['#0C2340', '#4B92DB'],
  'WAS': ['#5A1414', '#FFB612'],
};

/**
 * Get team colors for gradient backgrounds
 */
export function getTeamColors(team: string): [string, string] {
  return NFL_TEAM_COLORS[team?.toUpperCase()] || ['#374151', '#1F2937'];
}

