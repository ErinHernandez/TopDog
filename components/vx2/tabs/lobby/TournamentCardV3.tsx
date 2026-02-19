/**
 * TournamentCardV3 - Complete rebuild with "Flex-in-Grid" architecture
 * 
 * Architecture:
 * - CSS Grid Parent: auto / 1fr / auto
 * - Flexbox Bottom Anchor: justifyContent: flex-end
 * - This guarantees bottom content reaches the edge
 * 
 * Key Innovation: "Flex-in-Grid" pattern
 * - Grid handles layout structure
 * - Flexbox handles bottom alignment within grid cell
 * 
 * @module TournamentCardV3
 */

import React from 'react';

import { cn } from '@/lib/styles';

import { LOBBY_THEME } from '../../core/constants/colors';
import type { Tournament } from '../../hooks/data';

import { TournamentCardLogo } from './elements';
import { BottomSectionV3 } from './TournamentCardBottomSectionV3';
import styles from './TournamentCardV3.module.css';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Card colors from LOBBY_THEME (core/constants/colors) */
const CARD_COLORS = {
  logoImage: '/tournament_card_background.png',
  backgroundFallback: LOBBY_THEME.cardBgFallback,
  borderDefault: LOBBY_THEME.cardBorderDefault,
  borderFeatured: LOBBY_THEME.cardBorderFeatured,
  textPrimary: LOBBY_THEME.cardTextPrimary,
  textSecondary: LOBBY_THEME.cardTextSecondary,
  progressBackground: LOBBY_THEME.progressBg,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Style overrides for customization
 * Used in sandbox/testing to experiment with different styles
 */
export interface CardStyleOverridesV3 {
  /** Background CSS value (e.g., 'url(...)', 'linear-gradient(...)') */
  background?: string;
  /** Fallback background color (solid color) */
  backgroundFallback?: string;
  /** Border color */
  border?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Accent color for featured cards */
  accent?: string;
  /** Progress bar background color */
  progressBg?: string;
  /** Card padding in pixels */
  padding?: number;
  /** Border radius in pixels */
  borderRadius?: number;
  /** Button background image/gradient */
  buttonBackground?: string;
  /** Button background solid color */
  buttonBackgroundColor?: string;
  /** Custom background image URL */
  backgroundImage?: string;
  /** Title font size in pixels (responsive override) */
  titleFontSize?: number;
  /** Minimum height in pixels (for fitting within container) */
  minHeight?: number;
}

/**
 * Props for the TournamentCardV3 component
 */
export interface TournamentCardV3Props {
  /** Tournament data object */
  tournament: Tournament;
  /** Callback when join button is clicked */
  onJoinClick?: () => void;
  /** Whether to show featured styling (accent border) */
  featured?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Style overrides for customization */
  styleOverrides?: CardStyleOverridesV3;
}

// ============================================================================
// SUB-COMPONENT: TitleSection
// ============================================================================

/**
 * TitleSection - Renders the tournament title
 *
 * Uses V3 spacing values for margins and typography
 */
function TitleSection({
  titleFontSize
}: {
  titleFontSize?: number
}): React.ReactElement {
  return (
    <div
      className={styles.titleWrapper}
      data-title-font-size={titleFontSize}
    >
      <h2
        className={cn('vx2-tournament-title-v3', styles.title)}
      >
        The TopDog<br />
        International
      </h2>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: TournamentCardV3
// ============================================================================

/**
 * TournamentCardV3 - Main tournament card component
 *
 * Complete rebuild with "Flex-in-Grid" architecture.
 * Uses V3 spacing constants throughout with CSS Modules for CSP compliance.
 */
export function TournamentCardV3({
  tournament,
  onJoinClick,
  featured = false,
  className = '',
  styleOverrides = {},
}: TournamentCardV3Props): React.ReactElement {
  // ----------------------------------------
  // Compute final styles (solid background only; logo inside card)
  // ----------------------------------------
  const finalColors = {
    backgroundFallback: styleOverrides.backgroundFallback ?? CARD_COLORS.backgroundFallback,
    border: styleOverrides.border ?? CARD_COLORS.borderDefault,
    borderWidth: styleOverrides.borderWidth ?? (featured ? 3 : 1),
    accent: styleOverrides.accent ?? CARD_COLORS.borderFeatured,
    progressBg: styleOverrides.progressBg ?? CARD_COLORS.progressBackground,
  };

  const finalSizes = {
    padding: styleOverrides.padding,
    borderRadius: styleOverrides.borderRadius,
    minHeight: styleOverrides.minHeight,
  };

  // Build CSS custom properties for dynamic overrides (--var not in React.CSSProperties)
  const cardStyle: React.CSSProperties & Record<string, string> = {};
  if (styleOverrides.backgroundFallback) {
    cardStyle['--card-bg'] = finalColors.backgroundFallback;
  }
  if (styleOverrides.border || featured) {
    cardStyle['--card-border'] = finalColors.border;
  }
  if (styleOverrides.minHeight) {
    cardStyle['--card-min-height'] = `${finalSizes.minHeight}px`;
  }
  if (styleOverrides.borderRadius) {
    cardStyle['--card-border-radius'] = `${finalSizes.borderRadius}px`;
  }
  if (styleOverrides.padding) {
    cardStyle['--card-padding'] = `${finalSizes.padding}px`;
  }

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <article
      className={cn(
        'vx2-tournament-card-v3',
        styles.card,
        { [styles.featured as string]: featured },
        className
      )}
      style={cardStyle}
      role="article"
      aria-label={`${tournament.title} tournament`}
    >
      {/* Content Grid - The Layout Engine */}
      <div className={styles.contentGrid}>
        {/* Row 1: Logo + Title (no full-bleed background; logo as logo only) */}
        <div className={styles.titleContainer}>
          <TournamentCardLogo src={CARD_COLORS.logoImage} alt="Tournament logo" maxHeight={72} />
          <TitleSection titleFontSize={styleOverrides.titleFontSize} />
        </div>

        {/* ========================================
            Row 2: Spacer (Takes 1fr)
            ======================================== */}
        <div
          className={styles.spacer}
          aria-hidden="true"
        />

        {/* ========================================
            Row 3: Bottom Anchor
            CRITICAL: Do not change these flex properties
            ======================================== */}
        <div className={styles.bottomAnchor}>
          <BottomSectionV3
            tournament={tournament}
            onJoinClick={onJoinClick}
            styleOverrides={{
              buttonBackground: styleOverrides.buttonBackground,
              buttonBackgroundColor: styleOverrides.buttonBackgroundColor,
              progressBg: finalColors.progressBg,
            }}
          />
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

/**
 * TournamentCardSkeletonV3 - Loading state placeholder
 *
 * Uses the same grid structure as the main card to prevent
 * layout shifts when the real content loads.
 * Uses V3 spacing constants with CSS Modules for CSP compliance.
 */
export function TournamentCardSkeletonV3(): React.ReactElement {
  return (
    <article
      className={cn('vx2-tournament-card-skeleton-v3 animate-pulse', styles.skeleton)}
      aria-hidden="true"
      aria-label="Loading tournament card"
    >
      {/* Content Grid */}
      <div className={styles.skeletonGrid}>
        {/* Title skeleton */}
        <div className={styles.skeletonTitleWrapper}>
          <div className={styles.skeletonBar} />
        </div>

        {/* Spacer */}
        <div className={styles.skeletonSpacer} />

        {/* Bottom section skeleton */}
        <div className={styles.skeletonBottomSection}>
          <div className={styles.skeletonBottomGrid}>
            {/* Button skeleton */}
            <div className={styles.skeletonButton} />

            {/* Stats skeleton */}
            <div className={styles.skeletonStatsGrid}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={styles.skeletonStatItem}
                >
                  <div className={styles.skeletonStatValue} />
                  <div className={styles.skeletonStatLabel} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TournamentCardV3;
