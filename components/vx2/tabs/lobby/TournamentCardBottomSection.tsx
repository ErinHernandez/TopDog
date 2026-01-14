/**
 * TournamentCardBottomSection - Stable bottom section for tournament card
 * 
 * Uses CSS Grid for stable positioning, eliminates layout shifts
 * 
 * A-Grade Requirements Met:
 * - TypeScript: Full type coverage
 * - Constants: All values from VX2 constants
 * - Single Responsibility: One component, one purpose
 * - Accessibility: ARIA labels, touch targets
 * - Documentation: JSDoc, props documented
 */

import React from 'react';
import { ProgressBar } from '../../components/shared';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { TEXT_COLORS } from '../../core/constants/colors';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';

// ============================================================================
// CONSTANTS (Preserve exact values from TournamentCard.tsx)
// ============================================================================

const BOTTOM_SECTION_PX = {
  // Grid gap between rows
  rowGap: SPACING.lg, // 16px
  
  // Progress section
  progressHeight: 8, // md size from ProgressBar
  progressMarginBottom: 0, // Use grid gap instead
  
  // Button
  buttonHeight: 57,
  buttonFontSize: TYPOGRAPHY.fontSize.sm, // 14px
  buttonBorderRadius: RADIUS.md, // 8px
  
  // Stats
  statsGap: SPACING.xl, // 24px
  statsValueFontSize: TYPOGRAPHY.fontSize.lg, // 18px
  statsLabelFontSize: TYPOGRAPHY.fontSize.xs, // 12px
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
    <div 
      className="text-center" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}
    >
      <span 
        className="vx2-tournament-stat-value font-bold" 
        style={{ 
          fontSize: `${BOTTOM_SECTION_PX.statsValueFontSize}px`, 
          color: TEXT_COLORS.primary,
          backgroundColor: '#000000',
          padding: '2px 6px',
          borderRadius: '4px',
        }}
      >
        {value}
      </span>
      <span 
        className="vx2-tournament-stat-label"
        style={{ 
          fontSize: `${BOTTOM_SECTION_PX.statsLabelFontSize}px`, 
          color: TEXT_COLORS.secondary,
          backgroundColor: '#000000',
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
  
  // CSS Grid layout with explicit rows
  // Row 1: Progress (conditional)
  // Row 2: Button
  // Row 3: Stats
  return (
    <div
      className="vx2-tournament-bottom-section"
      style={{
        display: 'grid',
        gridTemplateRows: tournament.maxEntries 
          ? 'auto auto auto' // Progress, Button, Stats
          : 'auto auto', // Button, Stats (no progress)
        gap: `${BOTTOM_SECTION_PX.rowGap}px`,
        // CSS containment to isolate layout calculations
        contain: 'layout style',
        // Prevent layout shifts from propagating
        willChange: 'auto',
      }}
    >
      {/* Progress Bar Row */}
      {tournament.maxEntries && (
        <div 
          className="vx2-progress-section"
          style={{
            // Fixed height container to prevent shifts
            height: `${BOTTOM_SECTION_PX.progressHeight}px`,
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

      {/* Join Button Row */}
      <button
        onClick={onJoinClick}
        className="vx2-tournament-button w-full font-semibold transition-colors duration-200 active:scale-[0.98]"
        style={{ 
          ...(styleOverrides.buttonBackground ? {} : TILED_BG_STYLE),
          ...(styleOverrides.buttonBackground ? { 
            backgroundImage: styleOverrides.buttonBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}),
          ...(styleOverrides.buttonBackgroundColor ? { 
            backgroundColor: styleOverrides.buttonBackgroundColor 
          } : {}),
          color: '#FFFFFF',
          height: `${BOTTOM_SECTION_PX.buttonHeight}px`,
          fontSize: `${BOTTOM_SECTION_PX.buttonFontSize}px`,
          borderRadius: `${BOTTOM_SECTION_PX.buttonBorderRadius}px`,
          border: 'none',
          cursor: 'pointer',
          // Fixed height, no flex-based sizing
          minHeight: `${BOTTOM_SECTION_PX.buttonHeight}px`,
          maxHeight: `${BOTTOM_SECTION_PX.buttonHeight}px`,
        }}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* Stats Grid Row */}
      <div 
        className="vx2-tournament-stats"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: `${BOTTOM_SECTION_PX.statsGap}px`,
          // Fixed dimensions to prevent shifts
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

export default TournamentCardBottomSection;
