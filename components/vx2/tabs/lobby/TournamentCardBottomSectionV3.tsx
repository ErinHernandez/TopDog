/**
 * TournamentCardBottomSectionV3 - Bottom section with new spacing
 *
 * Architecture:
 * - CSS Grid with fixed row heights (prevents layout shifts)
 * - Uses V3 spacing constants throughout
 * - No alignSelf - parent handles positioning with flexbox
 * Migrated to CSS Modules for CSP compliance
 *
 * @module TournamentCardBottomSectionV3
 */

import React from 'react';
import { cn } from '@/lib/styles';
import { ProgressBar } from '../../../ui';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING_V3, BOTTOM_GRID_V3 } from './constants/cardSpacingV3';
import styles from './TournamentCardBottomSectionV3.module.css';

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
    <div className={styles.statItem}>
      {/* Value */}
      <span
        className={cn(styles.statValue, 'vx2-tournament-stat-value-v3')}
        style={{
          '--stats-value-font-size': `${CARD_SPACING_V3.statsValueFontSize}px`,
        } as React.CSSProperties}
      >
        {value}
      </span>

      {/* Label */}
      <span
        className={cn(styles.statLabel, 'vx2-tournament-stat-label-v3')}
        style={{
          '--stats-label-font-size': `${CARD_SPACING_V3.statsLabelFontSize}px`,
        } as React.CSSProperties}
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
      className={cn(styles.bottomSectionV3, 'vx2-tournament-bottom-section-v3')}
      data-has-progress={hasProgress}
      style={{
        '--progress-height': `${CARD_SPACING_V3.progressHeight}px`,
        '--button-height': `${CARD_SPACING_V3.buttonHeight}px`,
        '--stats-height': `${CARD_SPACING_V3.statsHeight}px`,
        '--button-font-size': `${CARD_SPACING_V3.buttonFontSize}px`,
        '--stats-value-font-size': `${CARD_SPACING_V3.statsValueFontSize}px`,
        '--stats-label-font-size': `${CARD_SPACING_V3.statsLabelFontSize}px`,
        '--row-gap': `${CARD_SPACING_V3.bottomRowGap}px`,
        '--stats-gap': `${CARD_SPACING_V3.bottomStatsGap}px`,
        '--button-border-radius': `${CARD_SPACING_V3.buttonBorderRadius}px`,
      } as React.CSSProperties}
    >
      {/* ========================================
          Row 1: Progress Bar (conditional)
          Height: 10px fixed (V3)
          ======================================== */}
      {hasProgress && (
        <div
          className={cn(styles.progressSection, 'vx2-progress-section-v3')}
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
        className={cn(
          styles.button,
          !styleOverrides.buttonBackgroundColor && 'vx2-tournament-button-v3',
          styleOverrides.buttonBackgroundColor && styles.buttonCustom
        )}
        style={{
          ...(styleOverrides.buttonBackground ? {} : TILED_BG_STYLE),
          ...(styleOverrides.buttonBackground
            ? {
                '--button-bg-image': styleOverrides.buttonBackground,
              }
            : {}),
          ...(styleOverrides.buttonBackgroundColor
            ? {
                '--button-bg-color': styleOverrides.buttonBackgroundColor,
              }
            : {}),
        } as React.CSSProperties}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* ========================================
          Row 3: Stats Grid
          Height: 52px fixed (V3)
          ======================================== */}
      <div
        className={cn(styles.statsGrid, 'vx2-tournament-stats-v3')}
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
