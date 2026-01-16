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
  // Background image URL (WebP with PNG fallback)
  backgroundImage: 'url(/do_riding_football_III.webp)',
  backgroundImagePng: 'url(/do_riding_football_III.png)',
  
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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${blurPlaceholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${borderRadius - 1}px`,
          zIndex: 0,
        }}
      />
      
      {/* Layer 2: Full image - fades in when loaded */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: displayImageUrl,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${borderRadius - 1}px`,
          zIndex: 1,
          // Opacity transition for smooth fade-in
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          // GPU acceleration for smooth animation
          willChange: 'opacity',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
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
    <div
      style={{
        // Center the title horizontally
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        // No margin - padding on card container handles spacing uniformly
        // Isolate layout calculations
        contain: 'layout style',
      }}
    >
      <h2
        className="vx2-tournament-title"
        style={{
          // Typography
          fontSize: `${fontSize}px`,
          fontFamily: "'Anton SC', sans-serif",
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          lineHeight: CARD_DIMENSIONS.titleLineHeight,
          textAlign: 'center',
          // Colors
          color: CARD_COLORS.textPrimary,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          // Reset margin
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
      className={`vx2-tournament-card-v2 ${className}`}
      style={{
        // ========================================
        // CSS GRID LAYOUT - This is the key change
        // ========================================
        display: 'grid',
        gridTemplateRows: `${GRID_TEMPLATE.titleRow} ${GRID_TEMPLATE.spacerRow} ${GRID_TEMPLATE.bottomRow}`,
        gap: 0, // No gap - spacing is handled by the spacer row
        
        // ========================================
        // Dimensions
        // ========================================
        width: '100%',
        height: `${finalSizes.minHeight}px`, // Use explicit height instead of 100%
        minHeight: `${finalSizes.minHeight}px`,
        maxHeight: `${finalSizes.minHeight}px`, // Constrain height to prevent overflow
        padding: `${finalSizes.padding}px`,
        boxSizing: 'border-box', // Ensure padding is included in height calculation
        flexShrink: 0, // Prevent card from shrinking in flex container
        marginTop: 'auto', // Push card down to create equal spacing at top and bottom
        
        // ========================================
        // Appearance
        // ========================================
        backgroundColor: finalColors.backgroundFallback,
        borderRadius: `${finalSizes.borderRadius}px`,
        border: `${finalColors.borderWidth}px solid ${borderColor}`,
        
        // ========================================
        // Positioning
        // ========================================
        position: 'relative',
        overflow: 'hidden',
        
        // ========================================
        // CSS CONTAINMENT - Prevents layout shift propagation
        // ========================================
        contain: 'layout style paint',
        isolation: 'isolate',
      }}
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
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateRows: `${GRID_TEMPLATE.titleRow} ${GRID_TEMPLATE.spacerRow} ${GRID_TEMPLATE.bottomRow}`,
          gap: 0,
          height: '100%',
          width: '100%',
          contain: 'layout',
          overflow: 'hidden', // Prevent any content from overflowing
        }}
      >
        {/* Grid Row 1: Title Section */}
        <TitleSection titleFontSize={styleOverrides.titleFontSize} />

        {/* Grid Row 2: Flexible Spacer - expands to fill space */}
        <div
          aria-hidden="true"
        />

        {/* Grid Row 3: Bottom Section - Uses flexbox to push content to bottom */}
        <div
          style={{
            // Fill the entire grid cell
            alignSelf: 'stretch',
            
            // Use flexbox to push content to bottom edge
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            
            // NO bottom padding - content reaches the edge
            paddingBottom: 0,
            marginBottom: 0,
            
            // Ensure minimum height doesn't constrain
            minHeight: 0,
          }}
        >
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
      className="vx2-tournament-card-skeleton animate-pulse"
      style={{
        display: 'grid',
        gridTemplateRows: `${GRID_TEMPLATE.titleRow} ${GRID_TEMPLATE.spacerRow} ${GRID_TEMPLATE.bottomRow}`,
        gap: 0,
        width: '100%',
        minHeight: `${CARD_DIMENSIONS.minHeight}px`,
        padding: `${CARD_DIMENSIONS.padding}px`,
        backgroundColor: CARD_COLORS.backgroundFallback,
        borderRadius: `${CARD_DIMENSIONS.borderRadius}px`,
        border: `1px solid ${CARD_COLORS.borderDefault}`,
      }}
      aria-hidden="true"
      aria-label="Loading tournament card"
    >
      {/* Title skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          // No margin - padding on card container handles spacing uniformly
        }}
      >
        <div
          style={{
            width: '70%',
            height: `${CARD_DIMENSIONS.titleFontSize}px`,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Spacer - flexes to fill space */}
      <div style={{ minHeight: 0 }} />

      {/* Bottom section skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: '8px 57px 48px',
          gap: '16px',
          alignSelf: 'end',
        }}
      >
        {/* Progress bar skeleton */}
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
          }}
        />

        {/* Button skeleton */}
        <div
          style={{
            width: '100%',
            height: '57px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
          }}
        />

        {/* Stats skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            height: '48px',
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
                  width: '50px',
                  height: '24px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
              />
              <div
                style={{
                  width: '40px',
                  height: '14px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                }}
              />
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
