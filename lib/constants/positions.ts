/**
 * Shared Position Constants
 * 
 * Centralized position definitions used across the application.
 * Migrated from components/draft/v3/constants/positions.js
 */

// ============================================
// POSITION ARRAYS
// ============================================

/** All fantasy-relevant positions */
export const POSITIONS: readonly string[] = ['QB', 'RB', 'WR', 'TE'];

/** Positions eligible for FLEX spots */
export const FLEX_POSITIONS: readonly string[] = ['RB', 'WR', 'TE'];

/** Check if a position is valid */
export function isValidPosition(position: string): boolean {
  return (POSITIONS as readonly string[]).includes(position);
}

/** Check if a position is FLEX-eligible */
export function isFlexEligible(position: string): boolean {
  return (FLEX_POSITIONS as readonly string[]).includes(position);
}

// ============================================
// POSITION COLORS
// ============================================

export const POSITION_COLORS = {
  QB: {
    primary: '#F472B6',     // Pink
    name: 'QB',
    rgb: { r: 244, g: 114, b: 182 },
    rgba: 'rgba(244, 114, 182, 0.3)'
  },
  RB: {
    primary: '#0fba80',     // Green
    name: 'RB', 
    rgb: { r: 15, g: 186, b: 128 },
    rgba: 'rgba(15, 186, 128, 0.3)'
  },
  WR: {
    primary: '#FBBF25',     // Yellow/Gold
    name: 'WR',
    rgb: { r: 251, g: 191, b: 37 },
    rgba: 'rgba(251, 191, 37, 0.3)'
  },
  TE: {
    primary: '#7C3AED',     // Purple
    name: 'TE',
    rgb: { r: 124, g: 58, b: 237 },
    rgba: 'rgba(124, 58, 237, 0.3)'
  }
} as const;

// Position end colors for gradients
export const POSITION_END_COLORS = {
  QB: '#EC4899',
  RB: '#10B981',
  WR: '#F59E0B',
  TE: '#8B5CF6'
} as const;

// Position filter styles
export const POSITION_FILTER_STYLES = {
  QB: { bg: POSITION_COLORS.QB.rgba, border: POSITION_COLORS.QB.primary },
  RB: { bg: POSITION_COLORS.RB.rgba, border: POSITION_COLORS.RB.primary },
  WR: { bg: POSITION_COLORS.WR.rgba, border: POSITION_COLORS.WR.primary },
  TE: { bg: POSITION_COLORS.TE.rgba, border: POSITION_COLORS.TE.primary }
} as const;

// Gradient functions
export const GRADIENT_FUNCTIONS = {
  QB: `linear-gradient(135deg, ${POSITION_COLORS.QB.primary} 0%, ${POSITION_END_COLORS.QB} 100%)`,
  RB: `linear-gradient(135deg, ${POSITION_COLORS.RB.primary} 0%, ${POSITION_END_COLORS.RB} 100%)`,
  WR: `linear-gradient(135deg, ${POSITION_COLORS.WR.primary} 0%, ${POSITION_END_COLORS.WR} 100%)`,
  TE: `linear-gradient(135deg, ${POSITION_COLORS.TE.primary} 0%, ${POSITION_END_COLORS.TE} 100%)`
} as const;

// Queue gradients
export const QUEUE_GRADIENTS = {
  QB: `linear-gradient(180deg, ${POSITION_COLORS.QB.primary} 0%, ${POSITION_END_COLORS.QB} 100%)`,
  RB: `linear-gradient(180deg, ${POSITION_COLORS.RB.primary} 0%, ${POSITION_END_COLORS.RB} 100%)`,
  WR: `linear-gradient(180deg, ${POSITION_COLORS.WR.primary} 0%, ${POSITION_END_COLORS.WR} 100%)`,
  TE: `linear-gradient(180deg, ${POSITION_COLORS.TE.primary} 0%, ${POSITION_END_COLORS.TE} 100%)`
} as const;

// Position helpers
export const POSITION_HELPERS = {
  getColor: (position: string) => POSITION_COLORS[position as keyof typeof POSITION_COLORS]?.primary || '#666',
  getGradient: (position: string) => GRADIENT_FUNCTIONS[position as keyof typeof GRADIENT_FUNCTIONS] || GRADIENT_FUNCTIONS.QB,
  getQueueGradient: (position: string) => QUEUE_GRADIENTS[position as keyof typeof QUEUE_GRADIENTS] || QUEUE_GRADIENTS.QB
} as const;
