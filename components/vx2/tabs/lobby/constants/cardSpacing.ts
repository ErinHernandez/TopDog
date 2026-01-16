/**
 * Tournament Card Spacing System
 * 
 * Single source of truth for all spacing values in tournament card components.
 * Modify values here to adjust spacing globally.
 * 
 * @module cardSpacing
 */

// ============================================================================
// SPACING CONSTANTS
// ============================================================================

/**
 * All spacing values for tournament cards
 * 
 * NAMING CONVENTION:
 * - outer* = space between card border and content
 * - content* = space within content areas
 * - bottom* = space in the bottom section
 * - *Gap = space between items
 * - *Padding = space inside containers
 * - *Margin = space outside containers
 */
export const CARD_SPACING = {
  // ========================================
  // CARD CONTAINER
  // ========================================
  
  /**
   * Space between card border and all content (all 4 sides)
   * This is the main "padding" of the card
   */
  outerPadding: 21,
  
  // ========================================
  // TITLE SECTION (Row 1)
  // ========================================
  
  /** Space above the title */
  titleMarginTop: 12,
  
  /** Space below the title (before spacer) */
  titleMarginBottom: 0,
  
  // ========================================
  // SPACER SECTION (Row 2)
  // ========================================
  
  /** 
   * Minimum gap between title and bottom section
   * The spacer row is flexible (1fr) but has this minimum
   */
  spacerMinHeight: 24,
  
  // ========================================
  // BOTTOM SECTION (Row 3)
  // ========================================
  
  /**
   * Gap between rows in bottom section (progress bar, button, stats)
   * Applied as CSS grid gap
   */
  bottomRowGap: 16,
  
  /**
   * Gap between stat items in the stats grid
   * Applied as CSS grid gap
   */
  bottomStatsGap: 24,
  
  /**
   * Padding at the very bottom of the card
   * SET TO 0: Content should reach the inner edge of the card
   */
  bottomPadding: 0,
  
  // ========================================
  // FIXED HEIGHTS (for layout stability)
  // ========================================
  
  /** Progress bar height */
  progressHeight: 8,
  
  /** Join button height */
  buttonHeight: 57,
  
  /** Stats row height */
  statsHeight: 48,
  
  // ========================================
  // CARD DIMENSIONS
  // ========================================
  
  /** Card border radius */
  borderRadius: 16,
  
  /** Minimum card height */
  minHeight: 700,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type for spacing keys */
export type CardSpacingKey = keyof typeof CARD_SPACING;

/** Type for the entire spacing object */
export type CardSpacingType = typeof CARD_SPACING;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a spacing value, with optional override
 * 
 * @param key - The spacing constant key
 * @param override - Optional override value
 * @returns The spacing value to use
 * 
 * @example
 * const padding = getSpacing('outerPadding'); // 21
 * const padding = getSpacing('outerPadding', 30); // 30 (override)
 */
export function getSpacing(
  key: CardSpacingKey,
  override?: number
): number {
  return override ?? CARD_SPACING[key];
}

/**
 * Create a padding string for CSS
 * 
 * @param top - Top padding
 * @param right - Right padding (defaults to top)
 * @param bottom - Bottom padding (defaults to top)
 * @param left - Left padding (defaults to right)
 * @returns CSS padding string
 * 
 * @example
 * createPadding(21) // "21px"
 * createPadding(21, 16, 0, 16) // "21px 16px 0px 16px"
 */
export function createPadding(
  top: number,
  right?: number,
  bottom?: number,
  left?: number
): string {
  if (right === undefined) {
    return `${top}px`;
  }
  if (bottom === undefined) {
    return `${top}px ${right}px`;
  }
  if (left === undefined) {
    return `${top}px ${right}px ${bottom}px`;
  }
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

// ============================================================================
// GRID TEMPLATE HELPERS
// ============================================================================

/**
 * Grid template for the main card content
 * 3 rows: title (auto), spacer (flexible), bottom (auto)
 */
export const CARD_GRID_TEMPLATE = {
  /** Title row - sizes to content */
  titleRow: 'auto',
  
  /** Spacer row - takes remaining space */
  spacerRow: '1fr',
  
  /** Bottom row - sizes to content */
  bottomRow: 'auto',
  
  /** Combined template for gridTemplateRows */
  get rows(): string {
    return `${this.titleRow} ${this.spacerRow} ${this.bottomRow}`;
  },
} as const;

/**
 * Grid template for the bottom section
 * 3 rows: progress (fixed), button (fixed), stats (fixed)
 */
export const BOTTOM_SECTION_GRID_TEMPLATE = {
  /** Progress bar row */
  progressRow: `${CARD_SPACING.progressHeight}px`,
  
  /** Button row */
  buttonRow: `${CARD_SPACING.buttonHeight}px`,
  
  /** Stats row */
  statsRow: `${CARD_SPACING.statsHeight}px`,
  
  /** Combined template WITH progress bar */
  get rowsWithProgress(): string {
    return `${this.progressRow} ${this.buttonRow} ${this.statsRow}`;
  },
  
  /** Combined template WITHOUT progress bar */
  get rowsWithoutProgress(): string {
    return `${this.buttonRow} ${this.statsRow}`;
  },
} as const;

// Default export for convenience
export default CARD_SPACING;
