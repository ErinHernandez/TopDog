/**
 * TournamentCardBottomSectionV2 - Bottom section with fixed-height grid rows
 * 
 * Architecture:
 * - CSS Grid with 3 rows (or 2 if no progress bar)
 * - Row 1: Progress bar (8px fixed)
 * - Row 2: Join button (57px fixed)
 * - Row 3: Stats grid (48px fixed)
 * 
 * All row heights are FIXED in pixels. This eliminates layout shifts
 * because the grid does not need to recalculate when viewport changes.
 * 
 * @module TournamentCardBottomSectionV2
 */

import React from 'react';

// ============================================================================
// IMPORTS - Verify these paths match your project structure
// ============================================================================

import { ProgressBar } from '../../components/shared';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING, BOTTOM_SECTION_GRID_TEMPLATE } from './constants/cardSpacing';

// ============================================================================
// CONSTANTS - DO NOT MODIFY THESE VALUES
// ============================================================================

/**
 * Fixed pixel heights for each row
 * Uses centralized CARD_SPACING for consistency
 */
const ROW_HEIGHTS = {
  progress: CARD_SPACING.progressHeight,
  button: CARD_SPACING.buttonHeight,
  stats: CARD_SPACING.statsHeight,
} as const;

/**
 * Spacing constants for the bottom section
 * Uses centralized CARD_SPACING for consistency
 */
const SPACING = {
  rowGap: CARD_SPACING.bottomRowGap,
  statsGap: CARD_SPACING.bottomStatsGap,
} as const;

const TYPOGRAPHY = {
  // Button font size
  buttonFontSize: 14,
  
  // Stats value font size
  statsValueFontSize: 18,
  
  // Stats label font size  
  statsLabelFontSize: 12,
} as const;

const COLORS = {
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  
  // Background for stat items
  statBackground: '#000000',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the BottomSectionV2 component
 */
export interface BottomSectionV2Props {
  /** Tournament data object */
  tournament: Tournament;
  /** Callback when join button is clicked */
  onJoinClick?: () => void;
  /** Style overrides */
  styleOverrides?: {
    buttonBackground?: string;
    buttonBackgroundColor?: string;
    progressBg?: string;
  };
}

/**
 * Props for the StatItem sub-component
 */
interface StatItemProps {
  value: string;
  label: string;
}

// ============================================================================
// SUB-COMPONENT: StatItem
// ============================================================================

/**
 * StatItem - Single statistic display (value + label)
 * 
 * Renders a value on top of a label, both with black backgrounds
 * for readability over the card image.
 */
function StatItem({ value, label }: StatItemProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Value */}
      <span
        className="vx2-tournament-stat-value"
        style={{
          fontSize: `${TYPOGRAPHY.statsValueFontSize}px`,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
          backgroundColor: COLORS.statBackground,
          padding: '2px 6px',
          borderRadius: '4px',
        }}
      >
        {value}
      </span>
      
      {/* Label */}
      <span
        className="vx2-tournament-stat-label"
        style={{
          fontSize: `${TYPOGRAPHY.statsLabelFontSize}px`,
          color: COLORS.textSecondary,
          backgroundColor: COLORS.statBackground,
          padding: '1px 4px',
          borderRadius: '3px',
          marginTop: '2px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: BottomSectionV2
// ============================================================================

/**
 * BottomSectionV2 - Tournament card bottom section
 * 
 * Contains:
 * - Progress bar (optional, based on tournament.maxEntries)
 * - Join button
 * - Stats grid (Entry fee, Entries, 1st Place prize)
 */
export function BottomSectionV2({
  tournament,
  onJoinClick,
  styleOverrides = {},
}: BottomSectionV2Props): React.ReactElement {
  // ----------------------------------------
  // Calculate progress percentage
  // ----------------------------------------
  const hasProgress = Boolean(tournament.maxEntries);
  const fillPercentage = tournament.maxEntries
    ? Math.round((tournament.currentEntries / tournament.maxEntries) * 100)
    : 0;

  // ----------------------------------------
  // Resolve style overrides
  // ----------------------------------------
  const progressBg = styleOverrides.progressBg ?? 'rgba(55, 65, 81, 0.5)';

  // ----------------------------------------
  // Build grid template based on progress bar presence
  // Uses centralized BOTTOM_SECTION_GRID_TEMPLATE
  // ----------------------------------------

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className="vx2-tournament-bottom-section-v2"
      style={{
        // ========================================
        // CSS GRID with FIXED row heights
        // ========================================
        display: 'grid',
        gridTemplateRows: hasProgress
          ? BOTTOM_SECTION_GRID_TEMPLATE.rowsWithProgress
          : BOTTOM_SECTION_GRID_TEMPLATE.rowsWithoutProgress,
        gap: `${SPACING.rowGap}px`,
        
        // ========================================
        // Positioning
        // ========================================
        // REMOVED: alignSelf: 'end' — parent handles this now with flexbox
        width: '100%',
        
        // ========================================
        // CSS CONTAINMENT
        // ========================================
        contain: 'layout style paint',
      }}
    >
      {/* ========================================
          Row 1: Progress Bar (conditional)
          Height: 8px fixed
          ======================================== */}
      {hasProgress && (
        <div
          className="vx2-progress-section"
          style={{
            height: `${ROW_HEIGHTS.progress}px`,
            display: 'flex',
            alignItems: 'center',
            contain: 'layout',
          }}
        >
          <ProgressBar
            value={fillPercentage}
            fillBackgroundImage="url(/wr_blue.png)"
            backgroundColor={progressBg}
            size="md"
          />
        </div>
      )}

      {/* ========================================
          Row 2: Join Button
          Height: 57px fixed (min, max, and height all set)
          ======================================== */}
      <button
        onClick={onJoinClick}
        className="vx2-tournament-button"
        style={{
          // ----------------------------------------
          // Background (tiled or custom)
          // ----------------------------------------
          ...(styleOverrides.buttonBackground ? {} : TILED_BG_STYLE),
          ...(styleOverrides.buttonBackground
            ? {
                backgroundImage: styleOverrides.buttonBackground,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
          ...(styleOverrides.buttonBackgroundColor
            ? {
                backgroundColor: styleOverrides.buttonBackgroundColor,
              }
            : {}),

          // ----------------------------------------
          // FIXED dimensions - all three are set
          // ----------------------------------------
          height: `${ROW_HEIGHTS.button}px`,
          minHeight: `${ROW_HEIGHTS.button}px`,
          maxHeight: `${ROW_HEIGHTS.button}px`,

          // ----------------------------------------
          // Typography
          // ----------------------------------------
          color: COLORS.textPrimary,
          fontSize: `${TYPOGRAPHY.buttonFontSize}px`,
          fontWeight: 600,

          // ----------------------------------------
          // Appearance
          // ----------------------------------------
          width: '100%',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',

          // ----------------------------------------
          // Interaction
          // ----------------------------------------
          transition: 'background-color 0.2s ease',

          // ----------------------------------------
          // CSS containment
          // ----------------------------------------
          contain: 'layout style',
        }}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* ========================================
          Row 3: Stats Grid
          Height: 48px fixed
          ======================================== */}
      <div
        className="vx2-tournament-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: `${SPACING.statsGap}px`,
          height: `${ROW_HEIGHTS.stats}px`,
          alignContent: 'center',
          contain: 'layout',
        }}
      >
        <StatItem value={tournament.entryFee} label="Entry" />
        <StatItem value={tournament.totalEntries} label="Entries" />
        <StatItem value={tournament.firstPlacePrize} label="1st Place" />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BottomSectionV2;
