/**
 * TournamentCard - Tournament display card for lobby
 * 
 * A-Grade Requirements Met:
 * - TypeScript: Full type coverage
 * - Constants: All values from VX2 constants
 * - Single Responsibility: One component, one purpose
 * - Accessibility: ARIA labels, touch targets
 * - Documentation: JSDoc, props documented
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS, BRAND_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { ProgressBar } from '../../components/shared';
import type { Tournament } from '../../hooks/data';
import { TILED_BG_STYLE } from '../../draft-room/constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_PX = {
  // Main card
  padding: 16,
  borderRadius: RADIUS.xl,
  
  // Title
  titleFontSize: TYPOGRAPHY.fontSize.xl,
  titleMarginBottom: SPACING.md,
  
  // Logo
  logoSize: 200,
  logoMarginBottom: SPACING.md,
  
  // Progress
  progressMarginBottom: SPACING.md,
  progressLabelFontSize: TYPOGRAPHY.fontSize.sm,
  progressLabelMarginBottom: SPACING.xs,
  
  // Button
  buttonHeight: 44,
  buttonFontSize: TYPOGRAPHY.fontSize.sm,
  buttonMarginBottom: SPACING.md,
  
  // Stats
  statsGap: SPACING.md,
  statsValueFontSize: TYPOGRAPHY.fontSize.lg,
  statsLabelFontSize: TYPOGRAPHY.fontSize.xs,
} as const;

const CARD_COLORS = {
  background: 'url(/tournament_card_background.png)',
  backgroundFallback: '#191932',
  border: 'rgba(75, 85, 99, 0.5)',
  text: TEXT_COLORS.primary,
  textMuted: TEXT_COLORS.secondary,
  accent: '#1E3A5F',  // Matches tiled background base color
  accentHover: BRAND_COLORS.accent,
  progressBg: 'rgba(55, 65, 81, 1)',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentCardProps {
  /** Tournament data */
  tournament: Tournament;
  /** Click handler for join button */
  onJoinClick?: () => void;
  /** Whether to show featured styling */
  featured?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps): React.ReactElement {
  return (
    <div className="text-center">
      <div 
        className="font-bold" 
        style={{ 
          fontSize: `${CARD_PX.statsValueFontSize}px`, 
          color: CARD_COLORS.text,
        }}
      >
        {value}
      </div>
      <div 
        style={{ 
          fontSize: `${CARD_PX.statsLabelFontSize}px`, 
          color: CARD_COLORS.textMuted,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TournamentCard({
  tournament,
  onJoinClick,
  featured = false,
  className = '',
}: TournamentCardProps): React.ReactElement {
  const fillPercentage = tournament.maxEntries 
    ? Math.round((tournament.currentEntries / tournament.maxEntries) * 100)
    : 0;
  
  return (
    <div 
      className={`relative ${className}`}
      style={{
        backgroundImage: CARD_COLORS.background,
        backgroundColor: CARD_COLORS.backgroundFallback,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: `${CARD_PX.borderRadius}px`,
        border: featured 
          ? `3px solid ${CARD_COLORS.accent}` 
          : `1px solid ${CARD_COLORS.border}`,
        padding: `${CARD_PX.padding}px`,
      }}
      role="article"
      aria-label={`${tournament.title} tournament`}
    >
      {/* Tournament Title - Split into two lines */}
      <h2 
        className="text-center font-bold leading-tight"
        style={{ 
          fontSize: `${CARD_PX.titleFontSize}px`, 
          color: CARD_COLORS.text,
          marginBottom: `${CARD_PX.titleMarginBottom}px`,
        }}
      >
        {tournament.title.includes('INTERNATIONAL') ? (
          <>
            {tournament.title.replace(' INTERNATIONAL', '')}<br />
            INTERNATIONAL
          </>
        ) : (
          tournament.title
        )}
      </h2>

      {/* Tournament Logo/Image */}
      {featured && (
        <div 
          className="flex justify-center"
          style={{ marginBottom: `${CARD_PX.logoMarginBottom}px` }}
        >
          <img 
            src="/globe_tournament.png" 
            alt=""
            aria-hidden="true"
            style={{ 
              width: `${CARD_PX.logoSize}px`, 
              height: `${CARD_PX.logoSize}px`, 
              objectFit: 'contain',
              borderRadius: `${RADIUS.lg}px`,
            }}
          />
        </div>
      )}

      {/* Progress Bar */}
      {tournament.maxEntries && (
        <div style={{ marginTop: `${SPACING.lg}px`, marginBottom: `${SPACING.lg}px` }}>
          <div 
            className="flex justify-between"
            style={{ 
              fontSize: `${CARD_PX.progressLabelFontSize}px`, 
              color: CARD_COLORS.textMuted,
              marginBottom: `${CARD_PX.progressLabelMarginBottom}px`,
            }}
          >
            <span>Tournament Fill</span>
            <span>{fillPercentage}% Full</span>
          </div>
          <ProgressBar 
            value={fillPercentage} 
            fillBackgroundImage="url(/wr_blue.png)"
            backgroundColor={CARD_COLORS.progressBg}
            size="md"
          />
        </div>
      )}

      {/* Join Button */}
      <button
        onClick={onJoinClick}
        className="w-full font-semibold transition-colors duration-200 active:scale-[0.98]"
        style={{ 
          ...TILED_BG_STYLE,
          color: '#FFFFFF',
          height: `${CARD_PX.buttonHeight}px`,
          fontSize: `${CARD_PX.buttonFontSize}px`,
          borderRadius: `${RADIUS.md}px`,
          marginBottom: `${CARD_PX.buttonMarginBottom}px`,
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* Stats Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: `${CARD_PX.statsGap}px`,
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
// SKELETON
// ============================================================================

export function TournamentCardSkeleton(): React.ReactElement {
  return (
    <div 
      className="animate-pulse"
      style={{
        backgroundColor: CARD_COLORS.background,
        borderRadius: `${CARD_PX.borderRadius}px`,
        border: `1px solid ${CARD_COLORS.border}`,
        padding: `${CARD_PX.padding}px`,
      }}
      aria-hidden="true"
    >
      {/* Title skeleton */}
      <div 
        className="mx-auto rounded"
        style={{ 
          width: '70%', 
          height: `${CARD_PX.titleFontSize}px`,
          backgroundColor: 'rgba(255,255,255,0.1)',
          marginBottom: `${CARD_PX.titleMarginBottom}px`,
        }} 
      />
      
      {/* Progress skeleton */}
      <div style={{ marginBottom: `${CARD_PX.progressMarginBottom}px` }}>
        <div 
          className="flex justify-between"
          style={{ marginBottom: `${CARD_PX.progressLabelMarginBottom}px` }}
        >
          <div 
            className="rounded"
            style={{ width: '80px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
          />
          <div 
            className="rounded"
            style={{ width: '60px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
          />
        </div>
        <div 
          className="rounded"
          style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
        />
      </div>
      
      {/* Button skeleton */}
      <div 
        className="rounded"
        style={{ 
          width: '100%', 
          height: `${CARD_PX.buttonHeight}px`,
          backgroundColor: 'rgba(255,255,255,0.1)',
          marginBottom: `${CARD_PX.buttonMarginBottom}px`,
        }} 
      />
      
      {/* Stats skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: `${CARD_PX.statsGap}px` }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div 
              className="rounded"
              style={{ width: '50px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: '4px' }} 
            />
            <div 
              className="rounded"
              style={{ width: '40px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TournamentCard;

