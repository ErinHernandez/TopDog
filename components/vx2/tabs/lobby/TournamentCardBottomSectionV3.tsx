/**
 * TournamentCardBottomSectionV3 - Bottom section with new spacing
 * 
 * Architecture:
 * - CSS Grid with fixed row heights (prevents layout shifts)
 * - Uses V3 spacing constants throughout
 * - No alignSelf - parent handles positioning with flexbox
 * 
 * @module TournamentCardBottomSectionV3
 */

import React from 'react';
import { ProgressBar } from '../../../ui';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING_V3, BOTTOM_GRID_V3 } from './constants/cardSpacingV3';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BottomSectionV3Props {
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
 * Uses V3 spacing values for fonts and padding
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
        className="vx2-tournament-stat-value-v3"
        style={{
          fontSize: `${CARD_SPACING_V3.statsValueFontSize}px`,
          fontWeight: 'bold',
          color: '#FFFFFF',
          backgroundColor: '#000000',
          padding: '3px 8px',
          borderRadius: '5px',
        }}
      >
        {value}
      </span>
      
      {/* Label */}
      <span
        className="vx2-tournament-stat-label-v3"
        style={{
          fontSize: `${CARD_SPACING_V3.statsLabelFontSize}px`,
          color: 'rgba(255, 255, 255, 0.7)',
          backgroundColor: '#000000',
          padding: '2px 6px',
          borderRadius: '4px',
          marginTop: '3px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: BottomSectionV3
// ============================================================================

/**
 * BottomSectionV3 - Tournament card bottom section
 * 
 * Contains:
 * - Progress bar (optional, based on tournament.maxEntries)
 * - Join button
 * - Stats grid (Entry fee, Entries, 1st Place prize)
 * 
 * Uses V3 spacing constants throughout.
 * Fixed-height rows prevent layout shifts.
 */
export function BottomSectionV3({
  tournament,
  onJoinClick,
  styleOverrides = {},
}: BottomSectionV3Props): React.ReactElement {
  // ----------------------------------------
  // Calculate progress percentage
  // ----------------------------------------
  const hasProgress = Boolean(tournament.maxEntries && tournament.maxEntries > 0);
  const fillPercentage = tournament.maxEntries
    ? Math.round((tournament.currentEntries / tournament.maxEntries) * 100)
    : 0;

  // ----------------------------------------
  // Resolve style overrides
  // ----------------------------------------
  const progressBg = styleOverrides.progressBg ?? 'rgba(55, 65, 81, 0.5)';

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className="vx2-tournament-bottom-section-v3"
      style={{
        // ========================================
        // CSS GRID with FIXED row heights
        // Strict fixed-height rows prevent layout shifts
        // ========================================
        display: 'grid',
        gridTemplateRows: hasProgress
          ? BOTTOM_GRID_V3.withProgress
          : BOTTOM_GRID_V3.withoutProgress,
        gap: `${CARD_SPACING_V3.bottomRowGap}px`,
        
        // ========================================
        // Positioning
        // ========================================
        width: '100%',
        
        // ========================================
        // CSS CONTAINMENT
        // ========================================
        contain: 'layout paint',
      }}
    >
      {/* ========================================
          Row 1: Progress Bar (conditional)
          Height: 10px fixed (V3)
          ======================================== */}
      {hasProgress && (
        <div
          className="vx2-progress-section-v3"
          style={{
            height: `${CARD_SPACING_V3.progressHeight}px`,
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
          Height: 60px fixed (V3)
          ======================================== */}
      <button
        onClick={onJoinClick}
        className="vx2-tournament-button-v3"
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
          height: `${CARD_SPACING_V3.buttonHeight}px`,
          minHeight: `${CARD_SPACING_V3.buttonHeight}px`,
          maxHeight: `${CARD_SPACING_V3.buttonHeight}px`,

          // ----------------------------------------
          // Typography
          // ----------------------------------------
          color: '#FFFFFF',
          fontSize: `${CARD_SPACING_V3.buttonFontSize}px`,
          fontWeight: 600,

          // ----------------------------------------
          // Appearance
          // ----------------------------------------
          width: '100%',
          borderRadius: `${CARD_SPACING_V3.buttonBorderRadius}px`,
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
          Height: 52px fixed (V3)
          ======================================== */}
      <div
        className="vx2-tournament-stats-v3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: `${CARD_SPACING_V3.bottomStatsGap}px`,
          height: `${CARD_SPACING_V3.statsHeight}px`,
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

export default BottomSectionV3;
