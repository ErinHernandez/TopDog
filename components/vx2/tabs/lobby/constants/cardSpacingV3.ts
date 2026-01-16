/**
 * Card Spacing Constants V3
 * 
 * Single source of truth for all spacing, sizing, and typography
 * values used in the tournament card atomic components.
 * 
 * @module cardSpacingV3
 */

export const CARD_SPACING_V3 = {
  // ========================================
  // CARD CONTAINER
  // ========================================
  
  /** Border radius of the card */
  borderRadius: 16,
  
  /** Padding inside the card (between border and content) */
  outerPadding: 21,
  
  /** Border width for featured cards */
  borderWidth: 3,
  
  /** Border color for featured cards */
  borderColor: '#1E3A5F',
  
  /** Minimum card height (for legacy TournamentCardV3) */
  minHeight: 650,
  
  // ========================================
  // TITLE SECTION
  // ========================================
  
  /** Title font size in pixels */
  titleFontSize: 46,
  
  /** Title line height (unitless) */
  titleLineHeight: 1.1,
  
  /** Title margin from top of content area */
  titleMarginTop: 12,
  
  /** Title font family */
  titleFontFamily: "'Anton SC', sans-serif",
  
  // ========================================
  // SPACER SECTION
  // ========================================
  
  /** Minimum height of spacer between title and bottom */
  spacerMinHeight: 24,
  
  // ========================================
  // BOTTOM SECTION
  // ========================================
  
  /** Gap between bottom section elements */
  bottomRowGap: 16,
  
  /** Gap between stat items */
  bottomStatsGap: 24,
  
  // ========================================
  // PROGRESS BAR
  // ========================================
  
  /** Progress bar height */
  progressHeight: 8,
  
  /** Progress bar border radius */
  progressBorderRadius: 4,
  
  /** Progress bar background color */
  progressBackgroundColor: 'rgba(55, 65, 81, 0.5)',
  
  // ========================================
  // BUTTON
  // ========================================
  
  /** Button height */
  buttonHeight: 57,
  
  /** Button border radius */
  buttonBorderRadius: 12,
  
  /** Button font size */
  buttonFontSize: 18,
  
  /** Button font weight */
  buttonFontWeight: 600,
  
  // ========================================
  // STATS
  // ========================================
  
  /** Stats row height */
  statsHeight: 48,
  
  /** Stats value font size */
  statsValueFontSize: 16,
  
  /** Stats label font size */
  statsLabelFontSize: 11,
  
  // ========================================
  // ANIMATIONS
  // ========================================
  
  /** Image fade transition duration */
  imageFadeDuration: '0.4s',
  
  /** Image fade easing */
  imageFadeEasing: 'ease-out',
  
} as const;

// ========================================
// LEGACY EXPORTS (for old TournamentCardV3)
// ========================================

/**
 * Grid template for bottom section
 * Fixed-height rows prevent layout shifts
 * @deprecated Use atomic components instead
 */
export const BOTTOM_GRID_V3 = {
  /** Template WITH progress bar */
  withProgress: `${CARD_SPACING_V3.progressHeight}px ${CARD_SPACING_V3.buttonHeight}px ${CARD_SPACING_V3.statsHeight}px`,
  
  /** Template WITHOUT progress bar */
  withoutProgress: `${CARD_SPACING_V3.buttonHeight}px ${CARD_SPACING_V3.statsHeight}px`,
} as const;

/**
 * Grid template for main card
 * The "Flex-in-Grid" Secret Sauce: auto / 1fr / auto
 * @deprecated Use atomic components instead
 */
export const CARD_GRID_V3 = {
  /** The critical template string */
  template: `auto 1fr auto`,
} as const;

// Type export
export type CardSpacingV3 = typeof CARD_SPACING_V3;

// Default export
export default CARD_SPACING_V3;
