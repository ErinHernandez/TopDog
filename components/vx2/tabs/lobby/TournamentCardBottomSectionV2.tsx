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
 * Migrated to CSS Modules for CSP compliance.
 *
 * @module TournamentCardBottomSectionV2
 */

import React from 'react';

import { cn } from '@/lib/styles';

// ============================================================================
// IMPORTS - Verify these paths match your project structure
// ============================================================================

import { ProgressBar } from '../../../ui';
import { LOBBY_THEME, BG_COLORS } from '../../core/constants/colors';
import type { Tournament } from '../../hooks/data';

import styles from './TournamentCardBottomSectionV2.module.css';

// ============================================================================
// CONSTANTS - DO NOT MODIFY THESE VALUES
// ============================================================================

/** Bottom section colors from LOBBY_THEME / BG_COLORS */
const COLORS = {
  textPrimary: LOBBY_THEME.cardTextPrimary,
  textSecondary: LOBBY_THEME.cardTextSecondary,
  statBackground: BG_COLORS.black,
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
    <div className={styles.statItem}>
      {/* Value */}
      <span
        className={cn(styles.statValue, 'vx2-tournament-stat-value')}
      >
        {value}
      </span>

      {/* Label */}
      <span
        className={cn(styles.statLabel, 'vx2-tournament-stat-label')}
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
  const progressBg = styleOverrides.progressBg ?? LOBBY_THEME.progressBg;

  // ----------------------------------------
  // Build grid template based on progress bar presence
  // Uses centralized BOTTOM_SECTION_GRID_TEMPLATE
  // ----------------------------------------

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className={cn(styles.bottomSectionV2, 'vx2-tournament-bottom-section-v2')}
      data-has-progress={hasProgress}
    >
      {/* ========================================
          Row 1: Progress Bar (conditional)
          Height: 8px fixed
          ======================================== */}
      {hasProgress && (
        <div
          className={cn(styles.progressSection, 'vx2-progress-section')}
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
        className={cn(
          styles.button,
          !styleOverrides.buttonBackgroundColor && 'vx2-tournament-button',
          styleOverrides.buttonBackgroundColor && styles.buttonCustom,
          !styleOverrides.buttonBackground && 'bg-tiled'
        )}
        data-button-bg-image={styleOverrides.buttonBackground}
        data-button-bg-color={styleOverrides.buttonBackgroundColor}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* ========================================
          Row 3: Stats Grid
          Height: 48px fixed
          ======================================== */}
      <div
        className={cn(styles.statsGrid, 'vx2-tournament-stats')}
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
