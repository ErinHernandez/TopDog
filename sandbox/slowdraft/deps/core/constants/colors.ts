/**
 * Color Constants for Slow Draft Sandbox
 */

export const POSITION_COLORS = {
  QB: '#F472B6',  // Pink
  RB: '#0fba80',  // Green
  WR: '#FBBF25',  // Yellow/Gold
  TE: '#7C3AED',  // Purple
  FLEX: null as null,
  BN: '#6B7280',  // Gray (bench)
} as const;

export const BG_COLORS = {
  primary: '#101927',      // Main dark background
  secondary: '#1f2937',    // Card backgrounds
  tertiary: '#111827',     // Darker sections
  elevated: 'rgba(255, 255, 255, 0.1)',  // Elevated surfaces
  card: '#1f2833',         // Player card background
  black: '#000000',        // Pure black (footer, etc.)
} as const;

export const TEXT_COLORS = {
  primary: '#ffffff',
  secondary: '#9ca3af',
  muted: '#6b7280',
  disabled: '#4b5563',
} as const;

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
