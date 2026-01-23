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
import { CARD_SPACING_V3, CARD_GRID_V3 } from './constants/cardSpacingV3';
import { BottomSectionV3 } from './TournamentCardBottomSectionV3';
import { TournamentCardLogo } from './elements';
import type { Tournament } from '../../hooks/data';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Color constants for the card
 * No full-bleed background image — solid color only; logo used as logo inside card.
 */
const CARD_COLORS = {
  /** Logo image (inside card, not background) */
  logoImage: '/tournament_card_background.png',
  /** Card background (solid only) */
  backgroundFallback: '#0a0a1a',
  borderDefault: 'rgba(75, 85, 99, 0.5)',
  borderFeatured: '#1E3A5F',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  progressBackground: 'rgba(55, 65, 81, 0.5)',
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
  const fontSize = titleFontSize ?? CARD_SPACING_V3.titleFontSize;
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: `${CARD_SPACING_V3.titleMarginTop}px`,
        textAlign: 'center',
        contain: 'layout style',
      }}
    >
      <h2
        className="vx2-tournament-title-v3"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: "'Anton SC', sans-serif",
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          lineHeight: CARD_SPACING_V3.titleLineHeight,
          textAlign: 'center',
          color: CARD_COLORS.textPrimary,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          margin: 0,
        }}
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
 * Uses V3 spacing constants throughout.
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
    padding: styleOverrides.padding ?? CARD_SPACING_V3.outerPadding,
    borderRadius: styleOverrides.borderRadius ?? CARD_SPACING_V3.borderRadius,
    minHeight: styleOverrides.minHeight ?? CARD_SPACING_V3.minHeight,
  };

  const borderColor = featured ? finalColors.accent : finalColors.border;

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <article
      className={`vx2-tournament-card-v3 ${className}`}
      style={{
        // ========================================
        // Container Setup
        // ========================================
        position: 'relative',
        width: '100%',
        minHeight: `${finalSizes.minHeight}px`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        flexShrink: 0,
        
        // ========================================
        // Appearance
        // ========================================
        backgroundColor: finalColors.backgroundFallback,
        borderRadius: `${finalSizes.borderRadius}px`,
        border: `${finalColors.borderWidth}px solid ${borderColor}`,
        
        // ========================================
        // Positioning
        // ========================================
        overflow: 'hidden',
        
        // ========================================
        // CSS CONTAINMENT
        // ========================================
        contain: 'layout style paint',
        isolation: 'isolate',
      }}
      role="article"
      aria-label={`${tournament.title} tournament`}
    >
      {/* Content Grid - The Layout Engine */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateRows: CARD_GRID_V3.template,
          padding: `${finalSizes.padding}px`,
          zIndex: 1,
          position: 'relative',
          contain: 'layout',
          overflow: 'hidden',
        }}
      >
        {/* Row 1: Logo + Title (no full-bleed background; logo as logo only) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <TournamentCardLogo src={CARD_COLORS.logoImage} alt="Tournament logo" maxHeight={72} />
          <TitleSection titleFontSize={styleOverrides.titleFontSize} />
        </div>

        {/* ========================================
            Row 2: Spacer (Takes 1fr)
            ======================================== */}
        <div
          style={{
            minHeight: `${CARD_SPACING_V3.spacerMinHeight}px`,
          }}
          aria-hidden="true"
        />

        {/* ========================================
            Row 3: Bottom Anchor
            CRITICAL: Do not change these flex properties
            ======================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end', // <--- This guarantees bottom alignment
            paddingBottom: 0,
            marginBottom: 0,
            minHeight: 0,
          }}
        >
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
 * Uses V3 spacing constants.
 */
export function TournamentCardSkeletonV3(): React.ReactElement {
  return (
    <article
      className="vx2-tournament-card-skeleton-v3 animate-pulse"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: `${CARD_SPACING_V3.minHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        backgroundColor: CARD_COLORS.backgroundFallback,
        borderRadius: `${CARD_SPACING_V3.borderRadius}px`,
        border: `1px solid ${CARD_COLORS.borderDefault}`,
        overflow: 'hidden',
      }}
      aria-hidden="true"
      aria-label="Loading tournament card"
    >
      {/* Content Grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateRows: CARD_GRID_V3.template,
          padding: `${CARD_SPACING_V3.outerPadding}px`,
        }}
      >
        {/* Title skeleton */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            marginTop: `${CARD_SPACING_V3.titleMarginTop}px`,
          }}
        >
          <div
            style={{
              width: '70%',
              height: `${CARD_SPACING_V3.titleFontSize}px`,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Spacer */}
        <div
          style={{
            minHeight: `${CARD_SPACING_V3.spacerMinHeight}px`,
          }}
        />

        {/* Bottom section skeleton */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: 0,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `${CARD_SPACING_V3.buttonHeight}px ${CARD_SPACING_V3.statsHeight}px`,
              gap: `${CARD_SPACING_V3.bottomRowGap}px`,
            }}
          >
            {/* Button skeleton */}
            <div
              style={{
                width: '100%',
                height: `${CARD_SPACING_V3.buttonHeight}px`,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: `${CARD_SPACING_V3.buttonBorderRadius}px`,
              }}
            />

            {/* Stats skeleton */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: `${CARD_SPACING_V3.bottomStatsGap}px`,
                height: `${CARD_SPACING_V3.statsHeight}px`,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '26px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '5px',
                      marginBottom: '4px',
                    }}
                  />
                  <div
                    style={{
                      width: '50px',
                      height: '17px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                    }}
                  />
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
