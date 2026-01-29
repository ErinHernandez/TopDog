/**
 * TournamentCardV2 - CSS Grid-based tournament card with zero layout shift
 * 
 * Architecture:
 * - Main container: CSS Grid with 3 explicit rows
 * - Row 1: Title section (auto height, content-based)
 * - Row 2: Fixed spacer (24px)
 * - Row 3: Bottom section (auto height, contains nested grid)
 * 
 * Key Features:
 * - CSS containment isolates layout calculations
 * - All critical elements have fixed pixel heights
 * - No flexbox space-between dependencies
 * - Background layers are absolute-positioned (don't affect grid)
 * 
 * @module TournamentCardV2
 */

import React, { useState, useEffect } from 'react';
import { cn, cssVars } from '@/lib/styles';
import styles from './TournamentCardV2.module.css';

// ============================================================================
// IMPORTS - Verify these paths match your project structure
// ============================================================================

// If these imports fail, check the actual paths in your project:
// - colors.ts should export BG_COLORS, TEXT_COLORS, BRAND_COLORS, STATE_COLORS
// - sizes.ts should export SPACING, RADIUS, TYPOGRAPHY
// - data.ts should export Tournament type

import { BG_COLORS, TEXT_COLORS, BRAND_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING, CARD_GRID_TEMPLATE } from './constants/cardSpacing';
import { BottomSectionV2 } from './TournamentCardBottomSectionV2';

// ============================================================================
// CONSTANTS - DO NOT MODIFY THESE VALUES
// ============================================================================

/**
 * Tiny blur placeholder (92 bytes) - displays instantly while full image loads
 * This is a base64-encoded WebP image, 20x27 pixels, heavily blurred
 */
const BLUR_PLACEHOLDER = 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAABwAwCdASoUABsAPyl+uFOuKCWisAwBwCUJZQAAW+q+9Bpo4aAA/uvZ+YkAc4jvVTc7+oJAY99soPLjJTrwm3j5Y3VE0BWmGAA=';

/**
 * Card dimension constants
 * Uses centralized CARD_SPACING for consistency
 */
const CARD_DIMENSIONS = {
  // Use centralized spacing constant
  padding: CARD_SPACING.outerPadding,
  
  // Border radius for the card container
  borderRadius: CARD_SPACING.borderRadius,
  
  // Title section
  titleFontSize: 46,
  titleMarginTop: CARD_SPACING.titleMarginTop,
  titleLineHeight: 1.1,
  
  // Minimum card height prevents collapse during loading
  minHeight: CARD_SPACING.minHeight,
} as const;

/**
 * Color constants for the card
 * These match the original TournamentCard colors exactly
 */
const CARD_COLORS = {
  // Background image URL (public/tournament_card_background.png)
  backgroundImage: 'url(/tournament_card_background.png)',
  backgroundImagePng: 'url(/tournament_card_background.png)',
  
  // Solid color fallback if images fail
  backgroundFallback: '#0a0a1a',
  
  // Border colors
  borderDefault: 'rgba(75, 85, 99, 0.5)',
  borderFeatured: '#1E3A5F',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  
  // Progress bar background
  progressBackground: 'rgba(55, 65, 81, 0.5)',
} as const;

/**
 * Grid row definitions
 * Uses centralized CARD_GRID_TEMPLATE for consistency
 */
const GRID_TEMPLATE = {
  titleRow: CARD_GRID_TEMPLATE.titleRow,
  spacerRow: CARD_GRID_TEMPLATE.spacerRow,
  bottomRow: CARD_GRID_TEMPLATE.bottomRow,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Style overrides for customization
 * Used in sandbox/testing to experiment with different styles
 */
export interface CardStyleOverrides {
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
  /** Custom text boxes to display at bottom of card */
  bottomTextBoxes?: Array<{ id: number | string; text: string }>;
}

/**
 * Props for the TournamentCardV2 component
 */
export interface TournamentCardV2Props {
  /** Tournament data object */
  tournament: Tournament;
  /** Callback when join button is clicked */
  onJoinClick?: () => void;
  /** Whether to show featured styling (accent border) */
  featured?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Style overrides for customization */
  styleOverrides?: CardStyleOverrides;
}

/**
 * Props for the BackgroundLayers sub-component
 */
interface BackgroundLayersProps {
  blurPlaceholder: string;
  fullImageUrl: string;
  useFallback: boolean;
  imageLoaded: boolean;
  borderRadius: number;
  originalUrl: string | null;
}

// ============================================================================
// SUB-COMPONENT: BackgroundLayers
// ============================================================================

/**
 * BackgroundLayers - Renders blur placeholder and full image
 * 
 * Architecture:
 * - Two absolutely-positioned div layers
 * - Layer 1 (z-index: 0): Blur placeholder, visible immediately
 * - Layer 2 (z-index: 1): Full image, fades in when loaded
 * 
 * These layers are position: absolute, so they do NOT affect the grid layout.
 * This is critical for preventing layout shifts during image loading.
 */
function BackgroundLayers({
  blurPlaceholder,
  fullImageUrl,
  useFallback,
  imageLoaded,
  borderRadius,
  originalUrl,
}: BackgroundLayersProps): React.ReactElement {
  // Determine which image to show based on fallback status
  const displayImageUrl = useFallback && originalUrl &&
    (originalUrl.endsWith('.webp') || originalUrl.includes('.webp'))
    ? CARD_COLORS.backgroundImagePng
    : fullImageUrl;

  return (
    <>
      {/* Layer 1: Blur placeholder - shows instantly */}
      <div
        aria-hidden="true"
        className={styles.blurLayer}
        style={cssVars({
          'blur-placeholder': `url(${blurPlaceholder})`,
        })}
      />

      {/* Layer 2: Full image - fades in when loaded */}
      <div
        aria-hidden="true"
        className={cn(styles.imageLayer, imageLoaded && styles.loaded)}
        style={cssVars({
          'card-bg-image-display': displayImageUrl,
        })}
      />
    </>
  );
}

// ============================================================================
// SUB-COMPONENT: TitleSection
// ============================================================================

/**
 * TitleSection - Renders the tournament title
 * 
 * The title uses CSS containment to isolate its layout.
 * This prevents any potential shifts from affecting other elements.
 */
function TitleSection({ titleFontSize }: { titleFontSize?: number }): React.ReactElement {
  const fontSize = titleFontSize ?? CARD_DIMENSIONS.titleFontSize;

  return (
    <div className={styles.titleSectionWrapper}>
      <h2
        className={cn('vx2-tournament-title', styles.title)}
        style={cssVars({
          'title-font-size': `${fontSize}px`,
        })}
      >
        The TopDog<br />
        International
      </h2>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: TournamentCardV2
// ============================================================================

/**
 * TournamentCardV2 - Main tournament card component
 * 
 * This is a drop-in replacement for TournamentCard.
 * Same props interface, same visual output, but zero layout shifts.
 */
export function TournamentCardV2({
  tournament,
  onJoinClick,
  featured = false,
  className = '',
  styleOverrides = {},
}: TournamentCardV2Props): React.ReactElement {
  // ----------------------------------------
  // State
  // ----------------------------------------
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // ----------------------------------------
  // Resolve style overrides
  // ----------------------------------------
  
  // Determine the background image URL
  const resolvedBackground = styleOverrides.backgroundImage
    ? `url(${styleOverrides.backgroundImage})`
    : (styleOverrides.background ?? CARD_COLORS.backgroundImage);

  // Extract URL from CSS background value for preloading
  const urlMatch = resolvedBackground.match(/url\(['"]?([^'"]+)['"]?\)/);
  const backgroundUrl = urlMatch ? urlMatch[1] : null;

  // ----------------------------------------
  // Image preloading effect
  // ----------------------------------------
  useEffect(() => {
    // Skip preloading for data URLs (already embedded)
    if (!backgroundUrl || backgroundUrl.startsWith('data:')) {
      setImageLoaded(true);
      return;
    }

    const img = new Image();

    // Fallback handler for WebP images
    const tryPngFallback = () => {
      if (backgroundUrl.endsWith('.webp') || backgroundUrl.includes('.webp')) {
        const pngUrl = backgroundUrl.replace('.webp', '.png').split('?')[0];
        
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setImageLoaded(true);
          setUseFallback(true);
        };
        fallbackImg.onerror = () => {
          // Both failed, show anyway (will use fallback color)
          setImageLoaded(true);
          setUseFallback(true);
        };
        fallbackImg.src = pngUrl;
      } else {
        setImageLoaded(true);
      }
    };

    img.onload = () => {
      setImageLoaded(true);
    };

    img.onerror = () => {
      tryPngFallback();
    };

    img.src = backgroundUrl;

    // Handle already-cached images
    if (img.complete) {
      setImageLoaded(true);
    }
  }, [backgroundUrl]);

  // ----------------------------------------
  // Compute final styles
  // ----------------------------------------
  const finalColors = {
    background: resolvedBackground,
    backgroundFallback: styleOverrides.backgroundFallback ?? CARD_COLORS.backgroundFallback,
    border: styleOverrides.border ?? CARD_COLORS.borderDefault,
    borderWidth: styleOverrides.borderWidth ?? (featured ? 3 : 1),
    accent: styleOverrides.accent ?? CARD_COLORS.borderFeatured,
    progressBg: styleOverrides.progressBg ?? CARD_COLORS.progressBackground,
  };

  const finalSizes = {
    padding: styleOverrides.padding ?? CARD_DIMENSIONS.padding,
    borderRadius: styleOverrides.borderRadius ?? CARD_DIMENSIONS.borderRadius,
    minHeight: styleOverrides.minHeight ?? CARD_DIMENSIONS.minHeight,
  };

  const borderColor = featured ? finalColors.accent : finalColors.border;

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className={cn(styles.cardContainer, featured && styles.featured, className)}
      style={cssVars({
        'card-padding': `${finalSizes.padding}px`,
        'card-border-radius': `${finalSizes.borderRadius}px`,
        'card-min-height': `${finalSizes.minHeight}px`,
        'card-border-width': `${finalColors.borderWidth}px`,
        'card-bg-fallback': finalColors.backgroundFallback,
        'card-border-color': borderColor,
        'card-bg-image': resolvedBackground,
      })}
      role="article"
      aria-label={`${tournament.title} tournament`}
    >
      {/* Background Layers - Absolute positioned, outside grid flow */}
      <BackgroundLayers
        blurPlaceholder={BLUR_PLACEHOLDER}
        fullImageUrl={finalColors.background}
        useFallback={useFallback}
        imageLoaded={imageLoaded}
        borderRadius={finalSizes.borderRadius}
        originalUrl={backgroundUrl}
      />

      {/* Content Container - Positioned above backgrounds */}
      <div className={styles.contentContainer}>
        {/* Grid Row 1: Title Section */}
        <TitleSection titleFontSize={styleOverrides.titleFontSize} />

        {/* Grid Row 2: Flexible Spacer - expands to fill space */}
        <div
          className={styles.spacer}
          aria-hidden="true"
        />

        {/* Grid Row 3: Bottom Section - Uses flexbox to push content to bottom */}
        <div className={styles.bottomSectionWrapper}>
          <BottomSectionV2
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
    </div>
  );
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

/**
 * TournamentCardSkeleton - Loading state placeholder
 * 
 * Uses the same grid structure as the main card to prevent
 * layout shifts when the real content loads.
 */
export function TournamentCardSkeleton(): React.ReactElement {
  return (
    <div
      className={cn(styles.skeletonContainer, styles.pulse)}
      style={cssVars({
        'card-padding': `${CARD_DIMENSIONS.padding}px`,
        'card-border-radius': `${CARD_DIMENSIONS.borderRadius}px`,
        'card-min-height': `${CARD_DIMENSIONS.minHeight}px`,
        'card-bg-fallback': CARD_COLORS.backgroundFallback,
        'card-border-color': CARD_COLORS.borderDefault,
      })}
      aria-hidden="true"
      aria-label="Loading tournament card"
    >
      {/* Title skeleton */}
      <div className={styles.skeletonTitleWrapper}>
        <div className={styles.skeletonTitleBar} />
      </div>

      {/* Spacer - flexes to fill space */}
      <div className={styles.spacer} />

      {/* Bottom section skeleton */}
      <div className={styles.skeletonBottomSection}>
        {/* Progress bar skeleton */}
        <div className={styles.skeletonProgressBar} />

        {/* Button skeleton */}
        <div className={styles.skeletonButton} />

        {/* Stats skeleton */}
        <div className={styles.skeletonStatsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonStatItem}>
              <div className={styles.skeletonStatLabel} />
              <div className={styles.skeletonStatValue} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TournamentCardV2;

// Re-export props type for external use
export type { TournamentCardV2Props as TournamentCardProps };
