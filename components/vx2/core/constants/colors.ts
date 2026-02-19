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

/**
 * Position badge text and accent (for contrast on position-colored backgrounds).
 * Use with POSITION_COLORS for full style: { bg: POSITION_COLORS[pos], ...POSITION_BADGE_THEME[pos] }.
 */
export const POSITION_BADGE_THEME: Record<string, { text: string; accent: string }> = {
  QB: { text: '#1a0a12', accent: 'rgba(244, 114, 182, 0.12)' },
  RB: { text: '#041a12', accent: 'rgba(15, 186, 128, 0.12)' },
  WR: { text: '#1a1505', accent: 'rgba(251, 191, 37, 0.12)' },
  TE: { text: '#ffffff', accent: 'rgba(124, 58, 237, 0.12)' },
  BN: { text: '#ffffff', accent: 'rgba(107, 114, 128, 0.12)' },
};

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
  overlayModal: 'rgba(0, 0, 0, 0.7)',
  modalBg: '#1E293B',
  errorBgLight: 'rgba(239, 68, 68, 0.15)',
  descriptionMuted: '#94A3B8',
  labelLight: '#E2E8F0',
  /** Navy/tiled background (navbar, draft cards, share header) */
  tiledBg: '#1E3A5F',
  /** Modal close / back icon (muted white) */
  modalCloseIcon: 'rgba(255, 255, 255, 0.5)',
  /** Profile/card box background (dark neutral) */
  boxBg: '#18181a',
  /** Focus ring for inputs (blue-400 25% opacity) – Stripe Elements, etc. */
  focusBoxShadow: '0 0 0 2px rgba(96, 165, 250, 0.25)',
} as const;

// ============================================================================
// THEME PALETTES (for modals, draft UI, etc.)
// Use these instead of hardcoding hex/rgba in components.
// CSS should use var(--...) tokens; JS/TS theme objects use these constants.
// ============================================================================

/** Leave/exit confirmation modal – single source for backdrop, panel, buttons */
export const MODAL_THEME_LEAVE_CONFIRM = {
  backdrop: UI_COLORS.overlayModal,
  background: UI_COLORS.modalBg,
  title: TEXT_COLORS.primary,
  description: UI_COLORS.gray400,
  primaryButton: STATE_COLORS.error,
  primaryButtonText: TEXT_COLORS.primary,
  secondaryButton: UI_COLORS.gray600,
  secondaryButtonText: TEXT_COLORS.primary,
  warningIcon: STATE_COLORS.error,
  warningIconBg: UI_COLORS.errorBgLight,
} as const;

/** Navigate-away / draft alerts prompt modal */
export const MODAL_THEME_NAVIGATE_AWAY_ALERTS = {
  backdrop: UI_COLORS.overlayModal,
  background: UI_COLORS.modalBg,
  title: TEXT_COLORS.primary,
  description: UI_COLORS.descriptionMuted,
  label: UI_COLORS.labelLight,
  border: BORDER_COLORS.default,
  primaryButton: STATE_COLORS.info,
  primaryText: TEXT_COLORS.primary,
  secondaryButton: BG_COLORS.elevated,
  secondaryText: UI_COLORS.descriptionMuted,
} as const;

/** Draft room footer (tab bar) – use TAB_BAR_COLORS + badge from STATE_COLORS */
export const DRAFT_FOOTER_THEME = {
  background: TAB_BAR_COLORS.background,
  border: TAB_BAR_COLORS.border,
  active: STATE_COLORS.active,
  inactive: TAB_BAR_COLORS.iconInactive,
  homeIndicator: TAB_BAR_COLORS.homeIndicator,
  badgeBg: STATE_COLORS.error,
  badgeText: TAB_BAR_COLORS.badgeText,
} as const;

/** Lobby card / join button – primary blue (matches existing lobby CTA) */
export const LOBBY_THEME = {
  joinButtonBg: '#1e40af',
  joinButtonText: TEXT_COLORS.primary,
  progressBarTrack: UI_COLORS.gray200,
  progressBarFill: '#1e40af',
  cardBgFallback: '#0a0a1a',
  cardBorderDefault: 'rgba(75, 85, 99, 0.5)',
  cardBorderFeatured: UI_COLORS.tiledBg,
  progressBg: 'rgba(55, 65, 81, 0.5)',
  cardTextPrimary: TEXT_COLORS.primary,
  cardTextSecondary: 'rgba(255, 255, 255, 0.7)',
} as const;

/** Player list / queue / roster search and rows */
export const DRAFT_LIST_THEME = {
  searchBg: BG_COLORS.secondary,
  searchPlaceholder: TEXT_COLORS.muted,
  rowBg: BG_COLORS.card,
  rowBorder: BORDER_COLORS.default,
  textPrimary: TEXT_COLORS.primary,
  textSecondary: TEXT_COLORS.secondary,
  textMuted: TEXT_COLORS.muted,
  queueButtonBorder: UI_COLORS.gray500,
  queueButtonActiveBorder: STATE_COLORS.activeLight,
  queueButtonActiveBg: 'rgba(59, 130, 246, 0.2)',
  removeButton: STATE_COLORS.error,
  removeButtonHover: 'rgba(239, 68, 68, 0.2)',
} as const;

/** Draft board / picks bar – backgrounds and borders */
export const DRAFT_BOARD_THEME = {
  background: BG_COLORS.primary,
  cellBorderDefault: BORDER_COLORS.default,
  cellBorderUser: STATE_COLORS.userHighlight,
  cellBorderUserOnClock: STATE_COLORS.error,
  headerBgGray: UI_COLORS.gray700,
  trackerEmpty: UI_COLORS.gray500,
} as const;

/** Picks bar card colors */
export const PICKS_BAR_THEME = {
  containerBg: BG_COLORS.primary,
  cardBg: UI_COLORS.gray700,
  userPick: '#1E3A5F',
  onTheClock: '#1E3A5F',
  onTheClockUrgent: '#DC2626',
  preDraft: '#1E3A5F',
  otherPick: UI_COLORS.gray500,
  emptyTracker: UI_COLORS.gray500,
  headerTextDark: BG_COLORS.black,
  headerTextLight: TEXT_COLORS.primary,
  pickNumberText: UI_COLORS.gray500,
  playerNameText: TEXT_COLORS.primary,
  awayText: TEXT_COLORS.secondary,
} as const;

/** Roster panel – dropdown, rows, borders, text (replaces local ROSTER_COLORS) */
export const ROSTER_THEME = {
  background: BG_COLORS.primary,
  rowBackground: 'rgba(255, 255, 255, 0.02)',
  rowBorder: BORDER_COLORS.default,
  headerBorder: BORDER_COLORS.default,
  dropdownBg: UI_COLORS.gray700,
  dropdownBorder: BG_COLORS.card,
  dropdownHoverBg: UI_COLORS.gray600,
  dropdownSelectedBg: UI_COLORS.gray600,
  buttonBg: UI_COLORS.gray700,
  textPrimary: TEXT_COLORS.primary,
  textSecondary: TEXT_COLORS.secondary,
  chevronColor: TEXT_COLORS.secondary,
  arrowColor: STATE_COLORS.info,
} as const;

/** Share options modal – iOS-style share sheet (backdrop, sheet, actions, app icons) */
export const SHARE_OPTIONS_THEME = {
  backdrop: 'rgba(0, 0, 0, 0.4)',
  sheetBackground: '#2C2C2E',
  handleBar: 'rgba(255, 255, 255, 0.3)',
  headerBorder: 'rgba(255, 255, 255, 0.08)',
  title: TEXT_COLORS.primary,
  subtitle: '#8E8E93',
  appIconBg: {
    messages: '#34C759',
    mail: '#007AFF',
    copy: '#636366',
    image: '#AF52DE',
    more: '#636366',
  },
  actionBackground: 'rgba(255, 255, 255, 0.06)',
  actionBackgroundActive: 'rgba(255, 255, 255, 0.1)',
  actionText: TEXT_COLORS.primary,
  actionBorder: 'rgba(255, 255, 255, 0.08)',
  successCheck: '#34C759',
  cancelBg: '#2C2C2E',
  cancelText: '#007AFF',
} as const;

/** Player stats card – header labels, lines, draft button (replaces local COLORS) */
export const PLAYER_STATS_THEME = {
  headerLabel: UI_COLORS.gray300,
  headerLabelDark: UI_COLORS.gray300,
  lineColor: UI_COLORS.gray600,
  lineColorDark: BG_COLORS.black,
  draftButtonActive: STATE_COLORS.error,
  draftButtonInactive: UI_COLORS.gray500,
} as const;

/** PayMongo deposit modal – payment method icon backgrounds (GCash, Maya, GrabPay) */
export const PAYMONGO_DEPOSIT_THEME = {
  gcashBg: '#007DFE',
  mayaBg: '#00D563',
  grabpayBg: '#00B14F',
  iconText: TEXT_COLORS.primary,
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

