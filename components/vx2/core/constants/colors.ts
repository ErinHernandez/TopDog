/**
 * VX2 Color Constants
 * 
 * Centralized color definitions for Version X2.
 * Migrated from VX with enterprise-grade organization.
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
  FLEX: null as null,     // Uses gradient (RB + WR + TE)
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
// NAVBAR COLORS (matches /wr_blue.png gradient)
// ============================================================================

/**
 * These colors match the navbar background image for consistent styling
 * Use NAVBAR_BLUE.solid for buttons and elements that should match the navbar
 */
export const NAVBAR_BLUE = {
  solid: '#1DA1F2',        // TopDog brand blue
  light: '#4DB5F5',        // Lighter variant
  dark: '#1A91DA',         // Darker variant
  gradient: 'linear-gradient(135deg, #1DA1F2 0%, #1A91DA 100%)', // CSS gradient alternative
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
  black: '#000000',        // Pure black (footer, etc.)
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
  light: 'rgba(255, 255, 255, 0.05)',
  subtle: 'rgba(255, 255, 255, 0.15)',
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
  active: '#60A5FA',       // Blue for active states (blue-400)
  activeLight: '#3B82F6',  // Blue-500
  userHighlight: '#3B82F6', // Blue for user's cells/picks
  selected: '#2DE2C5',     // Teal for selected
  hover: 'rgba(255, 255, 255, 0.1)',
  success: '#10B981',      // Green for success
  warning: '#F59E0B',      // Amber for warning
  error: '#EF4444',        // Red for error
  info: '#3B82F6',         // Blue for info states
} as const;

// ============================================================================
// TAB BAR COLORS
// ============================================================================

export const TAB_BAR_COLORS = {
  background: '#000000',
  border: '#374151',       // gray-700
  iconActive: NAVBAR_BLUE.solid,   // Matches navbar
  iconInactive: '#9CA3AF', // gray-400
  labelActive: NAVBAR_BLUE.solid,  // Matches navbar
  labelInactive: '#9CA3AF',
  badgeBackground: NAVBAR_BLUE.solid, // Matches navbar
  badgeText: '#FFFFFF',
  homeIndicator: 'rgba(255, 255, 255, 0.3)',
} as const;

// ============================================================================
// HEADER COLORS
// ============================================================================

export const HEADER_COLORS = {
  background: '#2563EB',   // blue-600 (or use image)
  text: '#ffffff',
  iconDefault: '#ffffff',
  iconHover: 'rgba(255, 255, 255, 0.8)',
  depositButton: 'rgba(255, 255, 255, 0.15)',
} as const;

// ============================================================================
// COMMON UI COLORS
// ============================================================================

export const UI_COLORS = {
  // Gray scale (matching Tailwind gray)
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Blue scale
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  
  // Other utilities
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
} as const;

// ============================================================================
// NFL TEAM COLORS
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
  'KC': ['#C99A1A', '#B8142A'],
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
  'WAS': ['#FFB612', '#5A1414'],
};

/**
 * Get team colors for gradient backgrounds
 */
export function getTeamColors(team: string): [string, string] {
  return NFL_TEAM_COLORS[team?.toUpperCase()] || ['#374151', '#1F2937'];
}

