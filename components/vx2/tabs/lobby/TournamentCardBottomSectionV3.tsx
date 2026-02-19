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
import { LOBBY_THEME } from '../../core/constants/colors';
import type { Tournament } from '../../hooks/data';

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
      >
        {value}
      </span>

      {/* Label */}
      <span
        className={cn(styles.statLabel, 'vx2-tournament-stat-label-v3')}
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
  const progressBg = styleOverrides.progressBg ?? LOBBY_THEME.progressBg;

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className={cn(styles.bottomSectionV3, 'vx2-tournament-bottom-section-v3')}
      data-has-progress={hasProgress}
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
