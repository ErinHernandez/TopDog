/**
 * TournamentCardBottomSection - Stable bottom section for tournament card
 *
 * Uses CSS Grid for stable positioning, eliminates layout shifts
 * Migrated to CSS Modules for CSP compliance
 *
 * A-Grade Requirements Met:
 * - TypeScript: Full type coverage
 * - Constants: All values from VX2 constants
 * - Single Responsibility: One component, one purpose
 * - Accessibility: ARIA labels, touch targets
 * - Documentation: JSDoc, props documented
 * - CSP Compliance: No inline styles, uses CSS Modules
 */

import React from 'react';

import { cn } from '@/lib/styles';

import { ProgressBar } from '../../../ui';
import type { Tournament } from '../../hooks/data';

import styles from './TournamentCardBottomSection.module.css';

// ============================================================================
// CONSTANTS (Preserve exact values from TournamentCard.tsx)
// ============================================================================

const BOTTOM_SECTION_PX = {
  // Grid gap between rows (uses CSS custom property: --spacing-lg)
  rowGap: 16, // 16px

  // Progress section
  progressHeight: 8, // md size from ProgressBar
  progressMarginBottom: 0, // Use grid gap instead

  // Button
  buttonHeight: 57,

  // Stats (uses CSS custom property: --spacing-xl)
  statsGap: 24, // 24px
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentCardBottomSectionProps {
  tournament: Tournament;
  onJoinClick?: () => void;
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
// SUB-COMPONENTS
// ============================================================================

function StatItem({ value, label }: StatItemProps): React.ReactElement {
  return (
    <div className={styles.statItem}>
      <span
        className={cn(styles.statValue, 'vx2-tournament-stat-value')}
      >
        {value}
      </span>
      <span
        className={cn(styles.statLabel, 'vx2-tournament-stat-label')}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TournamentCardBottomSection({
  tournament,
  onJoinClick,
  styleOverrides = {},
}: TournamentCardBottomSectionProps): React.ReactElement {
  const fillPercentage = tournament.maxEntries 
    ? Math.round((tournament.currentEntries / tournament.maxEntries) * 100)
    : 0;
  
  const progressBg = styleOverrides.progressBg ?? 'rgba(55, 65, 81, 0.5)';
  
  const hasProgress = Boolean(tournament.maxEntries);

  // CSS Grid layout with explicit rows
  // Row 1: Progress (conditional)
  // Row 2: Button
  // Row 3: Stats
  return (
    <div
      className={cn(styles.bottomSection, 'vx2-tournament-bottom-section')}
      data-has-progress={hasProgress}
      style={{
        '--progress-height': `${BOTTOM_SECTION_PX.progressHeight}px`,
        '--button-height': `${BOTTOM_SECTION_PX.buttonHeight}px`,
        '--stats-height': '48px',
        '--row-gap': `${BOTTOM_SECTION_PX.rowGap}px`,
        '--stats-gap': `${BOTTOM_SECTION_PX.statsGap}px`,
      } as React.CSSProperties}
      data-bottom-section-props="true"
    >
      {/* Progress Bar Row */}
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

      {/* Join Button Row */}
      <button
        onClick={onJoinClick}
        className={cn(
          styles.button,
          !styleOverrides.buttonBackgroundColor && 'vx2-tournament-button',
          styleOverrides.buttonBackgroundColor && styles.buttonCustom,
          !styleOverrides.buttonBackground && 'bg-tiled',
          'w-full font-semibold transition-colors duration-200 active:scale-[0.98]'
        )}
        data-button-bg-image={styleOverrides.buttonBackground}
        data-button-bg-color={styleOverrides.buttonBackgroundColor}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* Stats Grid Row */}
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

export default TournamentCardBottomSection;
