# Tournament Card V3 Complete Rebuild - Implementation Handoff

**Version:** 3.0  
**Date:** January 2025  
**Status:** 🔄 **READY FOR IMPLEMENTATION**  
**Goal:** Build a completely new tournament card component from scratch with a redesigned spacing system that ensures reliable bottom alignment  
**Time Estimate:** 4-5 hours  
**Difficulty:** Medium  
**Priority:** High (fixes persistent spacing issues with fresh approach)

---

## 🎯 Executive Summary

Build a completely new tournament card component (`TournamentCardV3`) from scratch with a redesigned spacing system. The new architecture uses different spacing values than V2 and a simpler, more maintainable structure while preserving all current features.

**What This Provides:**
- **New spacing system** - Different values than V2 (24px padding vs 21px, 20px gaps vs 16px, etc.)
- **Simplified architecture** - Cleaner code structure, easier to maintain
- **Reliable bottom alignment** - Flexbox-based approach ensures content reaches edge
- **All features preserved** - Progress bar, button, stats, image loading, style overrides
- **Non-breaking** - V3 can coexist with V2 for testing

**Key Differences from V2:**
- Larger base spacing (24px vs 21px outer padding)
- Different internal gaps (20px vs 16px between sections)
- Larger title spacing (16px vs 12px top margin)
- Different component heights (60px button vs 57px, 52px stats vs 48px)
- Simpler constant structure

---

## 📋 Problem Statement

The current V2 implementation has persistent bottom alignment issues despite multiple fixes. Building a new version from scratch with a different spacing system provides:

1. **Fresh start** - No legacy code constraints
2. **Different spacing values** - New approach may solve alignment issues
3. **Simpler architecture** - Easier to understand and maintain
4. **Better documentation** - Clear structure from the beginning

---

## 🏗️ Architecture Overview

### Layout Structure

```
TournamentCardV3 Container
├── Background Layers (absolute positioned)
└── Content Grid (3 rows)
    ├── Row 1: Title Section (auto height)
    ├── Row 2: Spacer (1fr - flexible)
    └── Row 3: Bottom Section Container
        └── Flexbox (justifyContent: flex-end)
            └── BottomSectionV3 (grid with fixed heights)
```

### Spacing System

**V3 uses different values than V2:**

| Property | V3 Value | V2 Value | Difference |
|----------|----------|----------|------------|
| Outer Padding | 24px | 21px | +3px |
| Title Margin Top | 16px | 12px | +4px |
| Spacer Min Height | 32px | 24px | +8px |
| Bottom Row Gap | 20px | 16px | +4px |
| Bottom Stats Gap | 28px | 24px | +4px |
| Progress Height | 10px | 8px | +2px |
| Button Height | 60px | 57px | +3px |
| Stats Height | 52px | 48px | +4px |
| Button Font Size | 15px | 14px | +1px |
| Stats Value Font | 20px | 18px | +2px |
| Stats Label Font | 13px | 12px | +1px |
| Border Radius | 18px | 16px | +2px |
| Min Height | 650px | 700px | -50px |

---

## 📁 File Structure

```
components/vx2/tabs/lobby/
├── constants/
│   └── cardSpacingV3.ts              [NEW] V3 spacing constants
├── TournamentCardV3.tsx               [NEW] Main V3 component
├── TournamentCardBottomSectionV3.tsx  [NEW] Bottom section V3
└── index.ts                           [MODIFY] Add V3 exports
```

---

## 🚀 Implementation Steps

### Phase 1: Create New Spacing Constants

**File**: `components/vx2/tabs/lobby/constants/cardSpacingV3.ts` (NEW)

Create this file with the following code:

```typescript
/**
 * Tournament Card V3 Spacing System
 * 
 * NEW spacing system with different values than V2.
 * Designed for reliable bottom alignment.
 * 
 * @module cardSpacingV3
 */

// ============================================================================
// SPACING CONSTANTS
// ============================================================================

/**
 * All spacing values for tournament card V3
 * 
 * NAMING CONVENTION:
 * - outer* = space between card border and content
 * - *Margin = space outside containers
 * - *Gap = space between items
 * - *Padding = space inside containers
 */
export const CARD_SPACING_V3 = {
  // ========================================
  // CARD CONTAINER
  // ========================================
  
  /**
   * Outer padding - LARGER than V2 (24px vs 21px)
   * Space between card border and all content
   */
  outerPadding: 24,
  
  /**
   * Border radius - Slightly larger than V2
   */
  borderRadius: 18,
  
  /**
   * Minimum card height - Different from V2
   */
  minHeight: 650,
  
  // ========================================
  // TITLE SECTION (Row 1)
  // ========================================
  
  /**
   * Top margin for title - DIFFERENT from V2 (16px vs 12px)
   */
  titleMarginTop: 16,
  
  /**
   * Bottom margin for title
   */
  titleMarginBottom: 0,
  
  /**
   * Title font size - Slightly larger than V2
   */
  titleFontSize: 48,
  
  /**
   * Title line height - Different from V2
   */
  titleLineHeight: 1.15,
  
  // ========================================
  // SPACER SECTION (Row 2)
  // ========================================
  
  /**
   * Minimum spacer height - DIFFERENT from V2 (32px vs 24px)
   */
  spacerMinHeight: 32,
  
  // ========================================
  // BOTTOM SECTION (Row 3)
  // ========================================
  
  /**
   * Gap between bottom section rows - DIFFERENT from V2 (20px vs 16px)
   * Applied as CSS grid gap
   */
  bottomRowGap: 20,
  
  /**
   * Gap between stat items - DIFFERENT from V2 (28px vs 24px)
   * Applied as CSS grid gap
   */
  bottomStatsGap: 28,
  
  /**
   * Bottom padding - MUST be 0 for content to reach edge
   */
  bottomPadding: 0,
  
  // ========================================
  // FIXED HEIGHTS (for layout stability)
  // ========================================
  
  /**
   * Progress bar height - DIFFERENT from V2 (10px vs 8px)
   */
  progressHeight: 10,
  
  /**
   * Join button height - DIFFERENT from V2 (60px vs 57px)
   */
  buttonHeight: 60,
  
  /**
   * Stats row height - DIFFERENT from V2 (52px vs 48px)
   */
  statsHeight: 52,
  
  // ========================================
  // BUTTON STYLING
  // ========================================
  
  /**
   * Button font size - DIFFERENT from V2 (15px vs 14px)
   */
  buttonFontSize: 15,
  
  /**
   * Button border radius - DIFFERENT from V2 (10px vs 8px)
   */
  buttonBorderRadius: 10,
  
  // ========================================
  // STATS STYLING
  // ========================================
  
  /**
   * Stats value font size - DIFFERENT from V2 (20px vs 18px)
   */
  statsValueFontSize: 20,
  
  /**
   * Stats label font size - DIFFERENT from V2 (13px vs 12px)
   */
  statsLabelFontSize: 13,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** Type for spacing keys */
export type CardSpacingV3Key = keyof typeof CARD_SPACING_V3;

/** Type for the entire spacing object */
export type CardSpacingV3Type = typeof CARD_SPACING_V3;

// ============================================================================
// GRID TEMPLATES
// ============================================================================

/**
 * Grid template for main card content
 * 3 rows: title (auto), spacer (flexible), bottom (auto)
 */
export const CARD_GRID_V3 = {
  /** Title row - sizes to content */
  titleRow: 'auto',
  
  /** Spacer row - takes remaining space */
  spacerRow: '1fr',
  
  /** Bottom row - sizes to content */
  bottomRow: 'auto',
} as const;

/**
 * Grid template for bottom section
 * 3 rows: progress (fixed), button (fixed), stats (fixed)
 */
export const BOTTOM_GRID_V3 = {
  /** Progress bar row */
  progressRow: `${CARD_SPACING_V3.progressHeight}px`,
  
  /** Button row */
  buttonRow: `${CARD_SPACING_V3.buttonHeight}px`,
  
  /** Stats row */
  statsRow: `${CARD_SPACING_V3.statsHeight}px`,
  
  /** Combined template WITH progress bar */
  get withProgress(): string {
    return `${this.progressRow} ${this.buttonRow} ${this.statsRow}`;
  },
  
  /** Combined template WITHOUT progress bar */
  get withoutProgress(): string {
    return `${this.buttonRow} ${this.statsRow}`;
  },
} as const;

// Default export for convenience
export default CARD_SPACING_V3;
```

### Phase 2: Create TournamentCardBottomSectionV3

**File**: `components/vx2/tabs/lobby/TournamentCardBottomSectionV3.tsx` (NEW)

Create this file with the following code:

```typescript
/**
 * TournamentCardBottomSectionV3 - Bottom section with new spacing
 * 
 * Architecture:
 * - CSS Grid with fixed row heights
 * - Uses new spacing constants (V3)
 * - No alignSelf - parent handles positioning
 * 
 * @module TournamentCardBottomSectionV3
 */

import React from 'react';
import { ProgressBar } from '../../components/shared';
import { TILED_BG_STYLE } from '../../draft-room/constants';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING_V3, BOTTOM_GRID_V3 } from './constants/cardSpacingV3';

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
        className="vx2-tournament-stat-value-v3"
        style={{
          fontSize: `${CARD_SPACING_V3.statsValueFontSize}px`,
          fontWeight: 'bold',
          color: '#FFFFFF',
          backgroundColor: '#000000',
          padding: '3px 8px',
          borderRadius: '5px',
        }}
      >
        {value}
      </span>
      
      {/* Label */}
      <span
        className="vx2-tournament-stat-label-v3"
        style={{
          fontSize: `${CARD_SPACING_V3.statsLabelFontSize}px`,
          color: 'rgba(255, 255, 255, 0.7)',
          backgroundColor: '#000000',
          padding: '2px 6px',
          borderRadius: '4px',
          marginTop: '3px',
        }}
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
 * Uses V3 spacing constants throughout
 */
export function BottomSectionV3({
  tournament,
  onJoinClick,
  styleOverrides = {},
}: BottomSectionV3Props): React.ReactElement {
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
  // Render
  // ----------------------------------------
  return (
    <div
      className="vx2-tournament-bottom-section-v3"
      style={{
        // ========================================
        // CSS GRID with FIXED row heights
        // ========================================
        display: 'grid',
        gridTemplateRows: hasProgress
          ? BOTTOM_GRID_V3.withProgress
          : BOTTOM_GRID_V3.withoutProgress,
        gap: `${CARD_SPACING_V3.bottomRowGap}px`,
        
        // ========================================
        // Positioning
        // ========================================
        width: '100%',
        
        // ========================================
        // CSS CONTAINMENT
        // ========================================
        contain: 'layout style paint',
      }}
    >
      {/* ========================================
          Row 1: Progress Bar (conditional)
          Height: 10px fixed (V3)
          ======================================== */}
      {hasProgress && (
        <div
          className="vx2-progress-section-v3"
          style={{
            height: `${CARD_SPACING_V3.progressHeight}px`,
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
          Height: 60px fixed (V3)
          ======================================== */}
      <button
        onClick={onJoinClick}
        className="vx2-tournament-button-v3"
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
          height: `${CARD_SPACING_V3.buttonHeight}px`,
          minHeight: `${CARD_SPACING_V3.buttonHeight}px`,
          maxHeight: `${CARD_SPACING_V3.buttonHeight}px`,

          // ----------------------------------------
          // Typography
          // ----------------------------------------
          color: '#FFFFFF',
          fontSize: `${CARD_SPACING_V3.buttonFontSize}px`,
          fontWeight: 600,

          // ----------------------------------------
          // Appearance
          // ----------------------------------------
          width: '100%',
          borderRadius: `${CARD_SPACING_V3.buttonBorderRadius}px`,
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
          Height: 52px fixed (V3)
          ======================================== */}
      <div
        className="vx2-tournament-stats-v3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: `${CARD_SPACING_V3.bottomStatsGap}px`,
          height: `${CARD_SPACING_V3.statsHeight}px`,
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

export default BottomSectionV3;
```

### Phase 3: Create TournamentCardV3

**File**: `components/vx2/tabs/lobby/TournamentCardV3.tsx` (NEW)

Create this file with the following code:

```typescript
/**
 * TournamentCardV3 - Complete rebuild with new spacing system
 * 
 * Architecture:
 * - Single container with explicit height
 * - CSS Grid: title (auto) | spacer (1fr) | bottom (auto)
 * - Bottom section uses flexbox parent to reach edge
 * - New spacing values throughout
 * 
 * Key Differences from V2:
 * - Different spacing constants (V3)
 * - Simpler structure
 * - More explicit height calculations
 * - Better documentation
 * 
 * @module TournamentCardV3
 */

import React, { useState, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import type { Tournament } from '../../hooks/data';
import { CARD_SPACING_V3, CARD_GRID_V3 } from './constants/cardSpacingV3';
import { BottomSectionV3 } from './TournamentCardBottomSectionV3';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Tiny blur placeholder (92 bytes) - displays instantly while full image loads
 */
const BLUR_PLACEHOLDER = 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAABwAwCdASoUABsAPyl+uFOuKCWisAwBwCUJZQAAW+q+9Bpo4aAA/uvZ+YkAc4jvVTc7+oJAY99soPLjJTrwm3j5Y3VE0BWmGAA=';

/**
 * Color constants for the card
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
        paddingTop: `${CARD_SPACING_V3.titleMarginTop}px`,
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
 * Complete rebuild with new spacing system.
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
    padding: styleOverrides.padding ?? CARD_SPACING_V3.outerPadding,
    borderRadius: styleOverrides.borderRadius ?? CARD_SPACING_V3.borderRadius,
    minHeight: styleOverrides.minHeight ?? CARD_SPACING_V3.minHeight,
  };

  const borderColor = featured ? finalColors.accent : finalColors.border;

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      className={`vx2-tournament-card-v3 ${className}`}
      style={{
        // ========================================
        // CSS GRID LAYOUT
        // ========================================
        display: 'grid',
        gridTemplateRows: `${CARD_GRID_V3.titleRow} ${CARD_GRID_V3.spacerRow} ${CARD_GRID_V3.bottomRow}`,
        gap: 0, // No gap - spacing is handled by padding
        
        // ========================================
        // Dimensions
        // ========================================
        width: '100%',
        height: `${finalSizes.minHeight}px`,
        minHeight: `${finalSizes.minHeight}px`,
        maxHeight: `${finalSizes.minHeight}px`,
        padding: `${finalSizes.padding}px`,
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
        position: 'relative',
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
          gridTemplateRows: `${CARD_GRID_V3.titleRow} ${CARD_GRID_V3.spacerRow} ${CARD_GRID_V3.bottomRow}`,
          gap: 0,
          height: '100%',
          width: '100%',
          contain: 'layout',
          overflow: 'hidden',
        }}
      >
        {/* Grid Row 1: Title Section */}
        <TitleSection titleFontSize={styleOverrides.titleFontSize} />

        {/* Grid Row 2: Flexible Spacer - expands to fill space */}
        <div
          aria-hidden="true"
        />

        {/* Grid Row 3: Bottom Section - CRITICAL: Flexbox pushes to bottom */}
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
    </div>
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
    <div
      className="vx2-tournament-card-skeleton-v3 animate-pulse"
      style={{
        display: 'grid',
        gridTemplateRows: `${CARD_GRID_V3.titleRow} ${CARD_GRID_V3.spacerRow} ${CARD_GRID_V3.bottomRow}`,
        gap: 0,
        width: '100%',
        minHeight: `${CARD_SPACING_V3.minHeight}px`,
        padding: `${CARD_SPACING_V3.outerPadding}px`,
        backgroundColor: CARD_COLORS.backgroundFallback,
        borderRadius: `${CARD_SPACING_V3.borderRadius}px`,
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
          paddingTop: `${CARD_SPACING_V3.titleMarginTop}px`,
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

      {/* Spacer - flexes to fill space */}
      <div style={{ minHeight: 0 }} />

      {/* Bottom section skeleton */}
      <div
        style={{
          alignSelf: 'stretch',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
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
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TournamentCardV3;
```

### Phase 4: Update Exports

**File**: `components/vx2/tabs/lobby/index.ts`

Add V3 exports at the end of the file:

```typescript
// ... existing exports ...

// TournamentCardV3 exports (new rebuild with different spacing)
export { TournamentCardV3, TournamentCardSkeletonV3 } from './TournamentCardV3';
export type { TournamentCardV3Props, CardStyleOverridesV3 } from './TournamentCardV3';
export { BottomSectionV3 } from './TournamentCardBottomSectionV3';
export type { BottomSectionV3Props } from './TournamentCardBottomSectionV3';
```

### Phase 5: Update Sandbox for Testing (Optional)

**File**: `pages/testing-grounds/tournament-card-sandbox.js`

Add option to test V3 component alongside V2 for comparison.

---

## ✅ Testing Checklist

### Visual Verification

- [ ] Open `/testing-grounds/tournament-card-sandbox` (or create V3 test page)
- [ ] Verify card renders correctly with V3 spacing
- [ ] Check that bottom section reaches the bottom edge (no gap)
- [ ] Compare side-by-side with V2 to see spacing differences

### Spacing Verification

- [ ] Verify outer padding is 24px (larger than V2's 21px)
- [ ] Check title has 16px top margin (larger than V2's 12px)
- [ ] Verify button height is 60px (larger than V2's 57px)
- [ ] Check stats height is 52px (larger than V2's 48px)
- [ ] Verify bottom row gap is 20px (larger than V2's 16px)
- [ ] Check stats gap is 28px (larger than V2's 24px)

### Responsive Testing

- [ ] Test on iPhone SE (smallest device)
- [ ] Test on iPhone 14 Pro Max (largest device)
- [ ] Verify spacing remains consistent across device sizes
- [ ] Check that bottom content still reaches bottom on all devices

### Feature Testing

- [ ] Progress bar appears when tournament has maxEntries
- [ ] Join button is clickable and triggers onJoinClick
- [ ] Stats display correct tournament data
- [ ] Background image loads and fades in
- [ ] WebP fallback to PNG works
- [ ] Featured styling shows accent border

### Style Override Testing

- [ ] Test with custom `padding` override
- [ ] Test with custom `borderRadius` override
- [ ] Test with custom `buttonBackground` override
- [ ] Test with custom `backgroundImage` override
- [ ] Verify all overrides work correctly

### Layout Stability Testing

- [ ] Open/close browser DevTools panel (desktop)
- [ ] Show/hide mobile browser address bar
- [ ] Verify no layout shifts occur
- [ ] Check that bottom content stays at bottom during viewport changes

### Code Quality

- [ ] Run linter: `npm run lint`
- [ ] Verify no TypeScript errors
- [ ] Check that all imports resolve correctly
- [ ] Verify constants are properly exported/imported

---

## 🔍 Troubleshooting

### Issue: Bottom content still has a gap

**Check 1: Is the parent using flexbox correctly?**

The bottom section's parent div in TournamentCardV3.tsx MUST have:
```typescript
display: 'flex',
flexDirection: 'column',
justifyContent: 'flex-end',
paddingBottom: 0,
```

**Check 2: Is alignSelf: 'stretch' set?**

The bottom section parent MUST have:
```typescript
alignSelf: 'stretch',
```

**Check 3: Is the grid cell filling the space?**

Verify the grid row is set to `'auto'` and the parent container fills the cell.

### Issue: Spacing looks different than expected

**Check:** Verify you're using V3 constants, not V2:
- Import from `'./constants/cardSpacingV3'`
- Use `CARD_SPACING_V3` not `CARD_SPACING`
- Use `CARD_GRID_V3` not `CARD_GRID_TEMPLATE`

### Issue: Import errors

**Check:** Verify the constants file path:
```typescript
// Should be:
import { CARD_SPACING_V3, CARD_GRID_V3 } from './constants/cardSpacingV3';
```

### Issue: TypeScript errors about grid template getters

**Fix:** Use the getter methods correctly:
```typescript
// Correct:
gridTemplateRows: BOTTOM_GRID_V3.withProgress

// If getters don't work, use:
gridTemplateRows: `${BOTTOM_GRID_V3.progressRow} ${BOTTOM_GRID_V3.buttonRow} ${BOTTOM_GRID_V3.statsRow}`
```

---

## 📊 V2 vs V3 Comparison

### Spacing Values

| Property | V2 | V3 | Difference |
|----------|----|----|------------|
| Outer Padding | 21px | 24px | +3px |
| Title Margin Top | 12px | 16px | +4px |
| Spacer Min Height | 24px | 32px | +8px |
| Bottom Row Gap | 16px | 20px | +4px |
| Bottom Stats Gap | 24px | 28px | +4px |
| Progress Height | 8px | 10px | +2px |
| Button Height | 57px | 60px | +3px |
| Stats Height | 48px | 52px | +4px |
| Button Font | 14px | 15px | +1px |
| Stats Value Font | 18px | 20px | +2px |
| Stats Label Font | 12px | 13px | +1px |
| Border Radius | 16px | 18px | +2px |
| Min Height | 700px | 650px | -50px |

### Architecture Differences

**V2:**
- Uses `CARD_SPACING` constants
- More complex helper functions
- Grid templates with getters

**V3:**
- Uses `CARD_SPACING_V3` constants
- Simpler structure
- Direct grid template objects
- Cleaner code organization

---

## 🎓 Key Concepts

### Bottom Alignment Strategy

The critical fix for bottom alignment:

```typescript
// In TournamentCardV3.tsx - bottom grid row container
<div
  style={{
    alignSelf: 'stretch',        // Fill grid cell
    display: 'flex',             // Enable flexbox
    flexDirection: 'column',     // Vertical layout
    justifyContent: 'flex-end',  // Push to bottom
    paddingBottom: 0,            // No gap
  }}
>
  <BottomSectionV3 ... />
</div>
```

### Spacing Philosophy

V3 uses larger spacing values to:
- Provide more breathing room
- Make the card feel less cramped
- Potentially solve alignment issues with different proportions
- Give more flexibility for future content

### Non-Breaking Implementation

V3 can coexist with V2:
- Different component names (V3 vs V2)
- Different constant names (CARD_SPACING_V3 vs CARD_SPACING)
- Different class names (v3 suffix)
- Can be tested side-by-side

---

## 📝 Migration Notes

### Testing V3

1. Create a test page that uses `TournamentCardV3`
2. Compare side-by-side with `TournamentCardV2`
3. Verify bottom alignment works correctly
4. Test all features work as expected

### Adopting V3

Once V3 is verified:
1. Update `LobbyTabVX2.tsx` to use `TournamentCardV3` instead of `TournamentCardV2`
2. Keep V2 code for reference/rollback
3. Monitor for any issues

### Rollback Plan

If V3 has issues:
- V2 code remains unchanged
- Simply revert to using `TournamentCardV2` in components
- V3 can be removed or kept for future reference

---

## 🔗 Related Files

- `components/vx2/tabs/lobby/TournamentCardV2.tsx` - Previous version (for reference)
- `components/vx2/tabs/lobby/TournamentCardBottomSectionV2.tsx` - Previous bottom section
- `components/vx2/tabs/lobby/constants/cardSpacing.ts` - V2 spacing (for comparison)
- `components/vx2/tabs/lobby/LobbyTabVX2.tsx` - Where card is used
- `pages/testing-grounds/tournament-card-sandbox.js` - Testing environment

---

## ✨ Success Criteria

The implementation is successful when:

1. ✅ V3 component renders with new spacing values
2. ✅ Bottom content reaches the actual bottom edge (no gap)
3. ✅ All features work (progress bar, button, stats, image loading)
4. ✅ Spacing is visibly different from V2 (larger values)
5. ✅ No layout shifts when viewport changes
6. ✅ Style overrides work correctly
7. ✅ Code passes linting and TypeScript checks
8. ✅ Can be tested alongside V2 for comparison

---

## 🚦 Implementation Order

1. **Create constants file** - `cardSpacingV3.ts`
2. **Create bottom section** - `TournamentCardBottomSectionV3.tsx`
3. **Create main component** - `TournamentCardV3.tsx`
4. **Update exports** - `index.ts`
5. **Test in sandbox** - Verify rendering and spacing
6. **Compare with V2** - Side-by-side visual comparison
7. **Verify bottom alignment** - Content reaches edge
8. **Test all features** - Progress, button, stats, images
9. **Test responsive** - All device sizes
10. **Test style overrides** - Customization works

---

**Ready to implement?** Follow the phases in order. Each phase builds on the previous one. Test after Phase 3 (main component) to verify the card renders correctly.
