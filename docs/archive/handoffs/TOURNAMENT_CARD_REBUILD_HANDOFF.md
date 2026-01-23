# TournamentCard V2 Implementation Specification
## Zero-Ambiguity Build Guide

**Version:** 2.0 Final  
**Date:** January 2025  
**Estimated Time:** 4-6 hours  
**Difficulty:** Intermediate

---

## Overview

This document provides exact, copy-paste instructions to rebuild the TournamentCard component using CSS Grid. Follow each step in order. Do not skip steps. Do not improvise.

---

# PRE-IMPLEMENTATION CHECKLIST

Before writing any code, complete these steps:

```bash
# Step 1: Verify you're in the correct directory
cd /path/to/bestball-site
pwd
# Expected output should end with: bestball-site

# Step 2: Verify the target directory exists
ls -la components/vx2/tabs/lobby/
# You should see: TournamentCard.tsx, TournamentCardBottomSection.tsx, LobbyTabVX2.tsx

# Step 3: Create a backup branch
git checkout -b backup/tournament-card-original
git checkout main

# Step 4: Create working branch
git checkout -b feature/tournament-card-v2-grid
```

---

# PHASE 1: Create TournamentCardV2.tsx

## Step 1.1: Create the new file

```bash
touch components/vx2/tabs/lobby/TournamentCardV2.tsx
```

## Step 1.2: Copy this EXACT code into the file

Open `components/vx2/tabs/lobby/TournamentCardV2.tsx` and paste the following code exactly as written. Do not modify anything.

```typescript
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
 * These values are calibrated to match the original TournamentCard exactly
 */
const CARD_DIMENSIONS = {
  // Outer padding inside the card border
  padding: 21,
  
  // Border radius for the card container
  borderRadius: 16, // RADIUS.xl equivalent
  
  // Title section
  titleFontSize: 46,
  titleMarginTop: 12,
  titleLineHeight: 1.1,
  
  // Gap between title and bottom section
  spacerHeight: 24, // SPACING.xl equivalent
  
  // Minimum card height prevents collapse during loading
  minHeight: 400,
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
 * These create the stable 3-row structure
 */
const GRID_TEMPLATE = {
  // Row 1: Title - uses 'auto' but content is stable (doesn't change)
  titleRow: 'auto',
  
  // Row 2: Spacer - FIXED 24px, creates consistent gap
  spacerRow: '24px',
  
  // Row 3: Bottom section - uses 'auto' but internal heights are fixed
  bottomRow: 'auto',
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
function TitleSection(): React.ReactElement {
  return (
    <div
      style={{
        // Center the title horizontally
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        // Offset from top
        marginTop: `${CARD_DIMENSIONS.titleMarginTop}px`,
        // Isolate layout calculations
        contain: 'layout style',
      }}
    >
      <h2
        className="vx2-tournament-title"
        style={{
          // Typography
          fontSize: `${CARD_DIMENSIONS.titleFontSize}px`,
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
        minHeight: `${CARD_DIMENSIONS.minHeight}px`,
        padding: `${finalSizes.padding}px`,
        
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
          contain: 'layout',
        }}
      >
        {/* Grid Row 1: Title Section */}
        <TitleSection />

        {/* Grid Row 2: Fixed Spacer */}
        <div
          style={{
            height: GRID_TEMPLATE.spacerRow,
          }}
          aria-hidden="true"
        />

        {/* Grid Row 3: Bottom Section */}
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
          marginTop: `${CARD_DIMENSIONS.titleMarginTop}px`,
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

      {/* Spacer */}
      <div style={{ height: GRID_TEMPLATE.spacerRow }} />

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
```

## Step 1.3: Verify the file was created

```bash
ls -la components/vx2/tabs/lobby/TournamentCardV2.tsx
# Should show the file with size > 0
```

---

# PHASE 2: Create TournamentCardBottomSectionV2.tsx

## Step 2.1: Create the new file

```bash
touch components/vx2/tabs/lobby/TournamentCardBottomSectionV2.tsx
```

## Step 2.2: Copy this EXACT code into the file

Open `components/vx2/tabs/lobby/TournamentCardBottomSectionV2.tsx` and paste the following code exactly as written.

```typescript
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
 * 
 * @module TournamentCardBottomSectionV2
 */

import React from 'react';

// ============================================================================
// IMPORTS - Verify these paths match your project structure
// ============================================================================

import { ProgressBar } from '../../components/shared';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';

// ============================================================================
// CONSTANTS - DO NOT MODIFY THESE VALUES
// ============================================================================

/**
 * Fixed pixel heights for each row
 * These values are calibrated to match the original component exactly
 */
const ROW_HEIGHTS = {
  // Progress bar height (matches ProgressBar size="md")
  progress: 8,
  
  // Button height (exact measurement from original)
  button: 57,
  
  // Stats row height (value + label + padding)
  // Calculated: 18px (value) + 12px (label) + 18px (padding) = 48px
  stats: 48,
} as const;

/**
 * Spacing and typography constants
 */
const SPACING = {
  // Gap between grid rows
  rowGap: 16,
  
  // Gap between stat items
  statsGap: 24,
} as const;

const TYPOGRAPHY = {
  // Button font size
  buttonFontSize: 14,
  
  // Stats value font size
  statsValueFontSize: 18,
  
  // Stats label font size  
  statsLabelFontSize: 12,
} as const;

const COLORS = {
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  
  // Background for stat items
  statBackground: '#000000',
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Value */}
      <span
        className="vx2-tournament-stat-value"
        style={{
          fontSize: `${TYPOGRAPHY.statsValueFontSize}px`,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
          backgroundColor: COLORS.statBackground,
          padding: '2px 6px',
          borderRadius: '4px',
        }}
      >
        {value}
      </span>
      
      {/* Label */}
      <span
        className="vx2-tournament-stat-label"
        style={{
          fontSize: `${TYPOGRAPHY.statsLabelFontSize}px`,
          color: COLORS.textSecondary,
          backgroundColor: COLORS.statBackground,
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
  const progressBg = styleOverrides.progressBg ?? 'rgba(55, 65, 81, 0.5)';

  // ----------------------------------------
  // Build grid template based on progress bar presence
  // ----------------------------------------
  const gridTemplateRows = hasProgress
    ? `${ROW_HEIGHTS.progress}px ${ROW_HEIGHTS.button}px ${ROW_HEIGHTS.stats}px`
    : `${ROW_HEIGHTS.button}px ${ROW_HEIGHTS.stats}px`;

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className="vx2-tournament-bottom-section-v2"
      style={{
        // ========================================
        // CSS GRID with FIXED row heights
        // ========================================
        display: 'grid',
        gridTemplateRows: gridTemplateRows,
        gap: `${SPACING.rowGap}px`,
        
        // ========================================
        // Positioning
        // ========================================
        alignSelf: 'end', // Stick to bottom of parent grid cell
        width: '100%',
        
        // ========================================
        // CSS CONTAINMENT
        // ========================================
        contain: 'layout style paint',
      }}
    >
      {/* ========================================
          Row 1: Progress Bar (conditional)
          Height: 8px fixed
          ======================================== */}
      {hasProgress && (
        <div
          className="vx2-progress-section"
          style={{
            height: `${ROW_HEIGHTS.progress}px`,
            display: 'flex',
            alignItems: 'center',
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

      {/* ========================================
          Row 2: Join Button
          Height: 57px fixed (min, max, and height all set)
          ======================================== */}
      <button
        onClick={onJoinClick}
        className="vx2-tournament-button"
        style={{
          // ----------------------------------------
          // Background (tiled or custom)
          // ----------------------------------------
          ...(styleOverrides.buttonBackground ? {} : TILED_BG_STYLE),
          ...(styleOverrides.buttonBackground
            ? {
                backgroundImage: styleOverrides.buttonBackground,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
          ...(styleOverrides.buttonBackgroundColor
            ? {
                backgroundColor: styleOverrides.buttonBackgroundColor,
              }
            : {}),

          // ----------------------------------------
          // FIXED dimensions - all three are set
          // ----------------------------------------
          height: `${ROW_HEIGHTS.button}px`,
          minHeight: `${ROW_HEIGHTS.button}px`,
          maxHeight: `${ROW_HEIGHTS.button}px`,

          // ----------------------------------------
          // Typography
          // ----------------------------------------
          color: COLORS.textPrimary,
          fontSize: `${TYPOGRAPHY.buttonFontSize}px`,
          fontWeight: 600,

          // ----------------------------------------
          // Appearance
          // ----------------------------------------
          width: '100%',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',

          // ----------------------------------------
          // Interaction
          // ----------------------------------------
          transition: 'background-color 0.2s ease',

          // ----------------------------------------
          // CSS containment
          // ----------------------------------------
          contain: 'layout style',
        }}
        aria-label={`Join ${tournament.title} for ${tournament.entryFee}`}
      >
        Join Tournament
      </button>

      {/* ========================================
          Row 3: Stats Grid
          Height: 48px fixed
          ======================================== */}
      <div
        className="vx2-tournament-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: `${SPACING.statsGap}px`,
          height: `${ROW_HEIGHTS.stats}px`,
          alignContent: 'center',
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

// ============================================================================
// EXPORTS
// ============================================================================

export default BottomSectionV2;
```

## Step 2.3: Verify the file was created

```bash
ls -la components/vx2/tabs/lobby/TournamentCardBottomSectionV2.tsx
# Should show the file with size > 0
```

---

# PHASE 3: Update LobbyTabVX2.tsx

## Step 3.1: Open the file and find the import

```bash
# Find the current import line
grep -n "TournamentCard" components/vx2/tabs/lobby/LobbyTabVX2.tsx
```

You should see output like:
```
26:import { TournamentCard, TournamentCardSkeleton } from './TournamentCard';
```

## Step 3.2: Replace the import

Open `components/vx2/tabs/lobby/LobbyTabVX2.tsx` and find this line (around line 26):

```typescript
// FIND THIS LINE:
import { TournamentCard, TournamentCardSkeleton } from './TournamentCard';
```

Replace it with:

```typescript
// REPLACE WITH THIS LINE:
import { TournamentCardV2 as TournamentCard, TournamentCardSkeleton } from './TournamentCardV2';
```

**IMPORTANT:** 
- Only change this ONE line
- Do NOT change anything else in the file
- The `as TournamentCard` alias means the rest of the file works unchanged

## Step 3.3: Verify the change

```bash
grep -n "TournamentCardV2" components/vx2/tabs/lobby/LobbyTabVX2.tsx
# Should show the new import line
```

---

# PHASE 4: Update index.ts Exports

## Step 4.1: Find the current exports

```bash
cat components/vx2/tabs/lobby/index.ts
```

## Step 4.2: Add new exports

Open `components/vx2/tabs/lobby/index.ts` and add these lines at the end of the file:

```typescript
// TournamentCardV2 exports (new grid-based component)
export { TournamentCardV2, TournamentCardSkeleton } from './TournamentCardV2';
export type { TournamentCardV2Props, CardStyleOverrides } from './TournamentCardV2';

// Bottom section V2
export { BottomSectionV2 } from './TournamentCardBottomSectionV2';
export type { BottomSectionV2Props } from './TournamentCardBottomSectionV2';
```

---

# PHASE 5: Verify Build Compiles

## Step 5.1: Run TypeScript check

```bash
npx tsc --noEmit
```

**Expected result:** No errors

**If you see errors:**
- Import path errors → Check that the paths in the imports match your actual file structure
- Type errors → Verify the `Tournament` type has all required fields

## Step 5.2: Run the dev server

```bash
npm run dev
```

## Step 5.3: Navigate to the page with the tournament card

Open your browser to the lobby page that shows the tournament card.

---

# PHASE 6: Testing Protocol

Execute each test in order. Mark pass/fail.

## Test 6.1: Visual Match Test

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Take screenshot of old card (if available) | Baseline captured | |
| 2 | Take screenshot of new card | Screenshot captured | |
| 3 | Compare button height | Exactly 57px | |
| 4 | Compare title font | Anton SC, 46px | |
| 5 | Compare progress bar | 8px height, correct fill | |
| 6 | Compare stats layout | 3 columns, centered | |

## Test 6.2: Layout Shift Test - Desktop

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open Chrome DevTools | DevTools open | |
| 2 | Run measurement script (see below) | Positions recorded | |
| 3 | Resize browser window height by 100px | Window resized | |
| 4 | Run measurement script again | New positions recorded | |
| 5 | Compare positions | Difference < 1px for all elements | |

**Measurement Script (paste in browser console):**

```javascript
const measurePositions = () => {
  const elements = {
    card: document.querySelector('.vx2-tournament-card-v2'),
    title: document.querySelector('.vx2-tournament-title'),
    progress: document.querySelector('.vx2-progress-section'),
    button: document.querySelector('.vx2-tournament-button'),
    stats: document.querySelector('.vx2-tournament-stats'),
  };
  
  const positions = {};
  for (const [name, el] of Object.entries(elements)) {
    if (el) {
      const rect = el.getBoundingClientRect();
      positions[name] = { top: rect.top, left: rect.left, height: rect.height };
    }
  }
  
  console.table(positions);
  return positions;
};

// Run this, resize window, run again, compare
window.cardPositions = measurePositions();
```

## Test 6.3: Layout Shift Test - Mobile

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open Chrome DevTools device mode | Mobile view enabled | |
| 2 | Select iPhone 12 Pro | Device selected | |
| 3 | Record element positions | Positions noted | |
| 4 | Toggle device toolbar (simulates address bar) | Toolbar toggled | |
| 5 | Compare positions | Difference < 1px | |

## Test 6.4: Functionality Test

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click Join button | Click handler fires | |
| 2 | Press Tab to focus button | Button receives focus | |
| 3 | Press Enter on focused button | Click handler fires | |
| 4 | Check ARIA label | Label reads "Join [title] for [price]" | |

## Test 6.5: Image Loading Test

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open Network tab in DevTools | Network tab open | |
| 2 | Throttle to "Slow 3G" | Throttling enabled | |
| 3 | Hard refresh page (Ctrl+Shift+R) | Page reloads | |
| 4 | Watch card during image load | Blur shows, then fades to full image | |
| 5 | Check bottom section | No shift during image transition | |

---

# PHASE 7: Commit and Deploy

## Step 7.1: Stage changes

```bash
git add components/vx2/tabs/lobby/TournamentCardV2.tsx
git add components/vx2/tabs/lobby/TournamentCardBottomSectionV2.tsx
git add components/vx2/tabs/lobby/LobbyTabVX2.tsx
git add components/vx2/tabs/lobby/index.ts
```

## Step 7.2: Commit

```bash
git commit -m "feat: rebuild TournamentCard with CSS Grid to eliminate layout shifts

- Created TournamentCardV2.tsx with CSS Grid layout
- Created TournamentCardBottomSectionV2.tsx with fixed row heights
- Updated LobbyTabVX2 to use new component
- Added exports to index.ts

Architecture changes:
- Replaced flexbox with CSS Grid for main layout
- All critical rows have fixed pixel heights
- CSS containment isolates layout calculations
- Background layers are absolute-positioned

Fixes:
- Layout shift when desktop panel opens/closes
- Layout shift when mobile address bar shows/hides
- Layout shift during image loading"
```

## Step 7.3: Push

```bash
git push origin feature/tournament-card-v2-grid
```

## Step 7.4: Create PR or merge to main

```bash
# Option A: Create PR (recommended)
# Go to GitHub and create PR from feature/tournament-card-v2-grid to main

# Option B: Direct merge (if you have permissions)
git checkout main
git merge feature/tournament-card-v2-grid
git push origin main
```

---

# TROUBLESHOOTING

## Issue: Import errors for `../../core/constants/colors`

**Symptom:** TypeScript error "Cannot find module '../../core/constants/colors'"

**Fix:** Check your actual path structure. The correct path might be:
- `../../constants/colors` (without 'core')
- `../../../core/constants/colors` (different depth)
- `@/constants/colors` (if using path aliases)

Run this to find the actual file:
```bash
find . -name "colors.ts" -o -name "colors.js" | grep -v node_modules
```

## Issue: Import errors for `Tournament` type

**Symptom:** TypeScript error "Cannot find name 'Tournament'"

**Fix:** Check where the Tournament type is actually defined:
```bash
grep -rn "export.*Tournament" --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Then update the import path in both files.

## Issue: `ProgressBar` component not found

**Symptom:** TypeScript error "Cannot find module '../../components/shared'"

**Fix:** Find the actual ProgressBar location:
```bash
find . -name "ProgressBar*" | grep -v node_modules
```

## Issue: `TILED_BG_STYLE` not found

**Symptom:** TypeScript error "Cannot find name 'TILED_BG_STYLE'"

**Fix:** Find where this constant is defined:
```bash
grep -rn "TILED_BG_STYLE" --include="*.ts" --include="*.tsx" | grep -v node_modules
```

If it doesn't exist, replace it with this fallback:
```typescript
const TILED_BG_STYLE = {
  backgroundImage: 'url(/tile-pattern.png)',
  backgroundSize: '100px 100px',
  backgroundRepeat: 'repeat',
  backgroundColor: '#1E3A5F',
};
```

---

# ROLLBACK PROCEDURE

If something goes wrong, execute these commands:

```bash
# Revert LobbyTabVX2.tsx to use old component
git checkout HEAD -- components/vx2/tabs/lobby/LobbyTabVX2.tsx

# Revert index.ts exports
git checkout HEAD -- components/vx2/tabs/lobby/index.ts

# Delete new files
rm components/vx2/tabs/lobby/TournamentCardV2.tsx
rm components/vx2/tabs/lobby/TournamentCardBottomSectionV2.tsx

# Commit rollback
git add -A
git commit -m "revert: rollback TournamentCardV2 due to issues"
git push
```

---

# SUCCESS CRITERIA CHECKLIST

Before marking implementation complete, verify ALL items:

- [ ] `TournamentCardV2.tsx` created and compiles without errors
- [ ] `TournamentCardBottomSectionV2.tsx` created and compiles without errors
- [ ] `LobbyTabVX2.tsx` updated to import new component
- [ ] `index.ts` updated with new exports
- [ ] `npm run dev` starts without errors
- [ ] Card renders correctly in browser
- [ ] Visual appearance matches original exactly
- [ ] No layout shift when resizing browser window
- [ ] No layout shift when toggling mobile device toolbar
- [ ] Join button click handler works
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Image loads with blur-to-sharp transition
- [ ] All tests in Phase 6 pass

---

**END OF SPECIFICATION**
