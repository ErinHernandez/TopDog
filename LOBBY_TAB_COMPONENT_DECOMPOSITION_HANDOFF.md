# Lobby Tab Component Decomposition - Implementation Handoff

**Version:** 1.0  
**Date:** January 2025  
**Status:** 🔄 **READY FOR IMPLEMENTATION**  
**Goal:** Restructure LobbyTabVX2 by eliminating TournamentCardV3 and decomposing it into separate, reusable components rendered directly on the lobby tab page  
**Time Estimate:** 6-8 hours  
**Difficulty:** Medium-High  
**Priority:** High (improves maintainability and component reusability)

---

## 🎯 Executive Summary

Decompose `TournamentCardV3` into separate, isolated components and render them directly in `LobbyTabVX2`, eliminating the card wrapper entirely. All components will be fully isolated, testable in the sandbox, and follow React best practices for component composition.

**What This Provides:**
- **Component Isolation** - Each element is a standalone, reusable component
- **Better Maintainability** - Easier to modify individual elements without affecting others
- **Improved Testability** - Each component can be tested in isolation in the sandbox
- **Direct Composition** - Components rendered directly on lobby tab, no wrapper overhead
- **Type Safety** - Full TypeScript coverage for all components
- **Visual Preservation** - Exact same appearance, just restructured

**Key Benefits:**
- No more card wrapper - components compose directly
- Individual components can be reused elsewhere
- Easier to customize individual elements
- Better performance (no unnecessary wrapper layers)
- Clearer component boundaries

---

## 📋 Problem Statement

Currently, `LobbyTabVX2` uses `TournamentCardV3` as a monolithic component that contains all tournament display elements. This creates:

1. **Tight Coupling** - All elements are bundled together
2. **Limited Reusability** - Can't use individual elements elsewhere
3. **Harder Testing** - Can't test elements in isolation
4. **Maintenance Burden** - Changes to one element require understanding the whole card

**Solution:** Decompose the card into separate components that can be composed directly on the lobby tab page.

---

## 🏗️ Architecture Overview

### Current Structure

```
LobbyTabVX2
└── TournamentCardV3 (monolithic)
    ├── BackgroundLayers (internal function)
    ├── TitleSection (internal function)
    └── BottomSectionV3 (separate component)
        ├── ProgressBar
        ├── JoinButton
        └── StatsGrid
```

### New Structure

```
LobbyTabVX2
├── TournamentBackground (separate component)
├── Content Grid Container
│   ├── TournamentTitle (separate component)
│   ├── Spacer (flexible)
│   └── Bottom Section Container
│       ├── TournamentProgressBar (separate component)
│       ├── TournamentJoinButton (separate component)
│       └── TournamentStats (separate component)
```

### Component Hierarchy

```
components/vx2/tabs/lobby/
├── elements/                          [NEW DIRECTORY]
│   ├── TournamentBackground.tsx       [NEW] Background image layers
│   ├── TournamentTitle.tsx            [NEW] Title display
│   ├── TournamentProgressBar.tsx      [NEW] Progress indicator
│   ├── TournamentJoinButton.tsx       [NEW] Join action button
│   ├── TournamentStats.tsx            [NEW] Statistics grid
│   ├── types.ts                       [NEW] Type definitions
│   └── index.ts                       [NEW] Barrel export
├── hooks/                             [NEW DIRECTORY]
│   └── useTournamentImage.ts          [NEW] Image preloading hook
├── constants/
│   └── cardSpacingV3.ts               [UNCHANGED] Spacing constants
└── LobbyTabVX2.tsx                    [MAJOR RESTRUCTURE]
```

---

## 📁 File Structure

### New Files to Create

```
components/vx2/tabs/lobby/
├── elements/
│   ├── TournamentBackground.tsx
│   ├── TournamentTitle.tsx
│   ├── TournamentProgressBar.tsx
│   ├── TournamentJoinButton.tsx
│   ├── TournamentStats.tsx
│   ├── types.ts
│   └── index.ts
└── hooks/
    └── useTournamentImage.ts
```

### Files to Modify

- `components/vx2/tabs/lobby/LobbyTabVX2.tsx` - Major restructure
- `pages/testing-grounds/tournament-card-sandbox.js` - Add component isolation

### Files to Keep (Reference Only)

- `components/vx2/tabs/lobby/TournamentCardV3.tsx` - Keep for reference, mark as deprecated
- `components/vx2/tabs/lobby/constants/cardSpacingV3.ts` - Unchanged

---

## 🚀 Implementation Steps

### Step 1: Create Directory Structure

Create the following directories:
- `components/vx2/tabs/lobby/elements/`
- `components/vx2/tabs/lobby/hooks/`

### Step 2: Create Type Definitions

**File**: `components/vx2/tabs/lobby/elements/types.ts`

```typescript
/**
 * Type definitions for tournament lobby elements
 * 
 * @module types
 */

export interface TournamentBackgroundProps {
  /** Background image URL (CSS value, e.g., 'url(...)') */
  backgroundImage?: string;
  /** Blur placeholder data URL */
  blurPlaceholder?: string;
  /** Border radius in pixels */
  borderRadius: number;
  /** Whether the full image has loaded */
  imageLoaded: boolean;
  /** Whether to use PNG fallback */
  useFallback: boolean;
  /** Original image URL for fallback logic */
  originalUrl: string | null;
}

export interface TournamentTitleProps {
  /** Tournament title text */
  title: string;
  /** Optional font size override */
  fontSize?: number;
  /** Optional CSS class name */
  className?: string;
}

export interface TournamentProgressBarProps {
  /** Current number of entries */
  currentEntries: number;
  /** Maximum number of entries */
  maxEntries: number;
  /** Optional background color override */
  backgroundColor?: string;
}

export interface TournamentJoinButtonProps {
  /** Tournament title for aria-label */
  tournamentTitle: string;
  /** Entry fee (formatted, e.g., "$25") */
  entryFee: string;
  /** Click handler */
  onClick: () => void;
  /** Optional background image override */
  backgroundImage?: string;
  /** Optional background color override */
  backgroundColor?: string;
}

export interface TournamentStatsProps {
  /** Entry fee (formatted) */
  entryFee: string;
  /** Total entries (formatted) */
  totalEntries: string;
  /** First place prize (formatted) */
  firstPlacePrize: string;
}
```

### Step 3: Create Image Preloading Hook

**File**: `components/vx2/tabs/lobby/hooks/useTournamentImage.ts`

```typescript
/**
 * useTournamentImage - Image preloading hook
 * 
 * Handles background image preloading with WebP fallback support.
 * Extracted from TournamentCardV3 for reuse.
 * 
 * @example
 * ```tsx
 * const { imageLoaded, useFallback } = useTournamentImage(backgroundUrl);
 * ```
 */

import { useState, useEffect } from 'react';

export interface UseTournamentImageResult {
  /** Whether the image has loaded */
  imageLoaded: boolean;
  /** Whether to use PNG fallback */
  useFallback: boolean;
}

/**
 * Hook to preload tournament background image with fallback support
 * 
 * @param backgroundUrl - Image URL (extracted from CSS background value)
 * @returns Loading state and fallback flag
 */
export function useTournamentImage(
  backgroundUrl: string | null
): UseTournamentImageResult {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

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

  return { imageLoaded, useFallback };
}
```

### Step 4: Create TournamentBackground Component

**File**: `components/vx2/tabs/lobby/elements/TournamentBackground.tsx`

```typescript
/**
 * TournamentBackground - Background image layers
 * 
 * Renders blur placeholder and full image with fade-in transition.
 * Extracted from TournamentCardV3 BackgroundLayers function.
 * 
 * Architecture:
 * - Two absolutely-positioned div layers
 * - Layer 1 (z-index: 0): Blur placeholder, visible immediately
 * - Layer 2 (z-index: 1): Full image, fades in when loaded
 * 
 * @module TournamentBackground
 */

import React from 'react';
import type { TournamentBackgroundProps } from './types';

/**
 * Default blur placeholder (92 bytes) - displays instantly while full image loads
 */
const BLUR_PLACEHOLDER = 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAABwAwCdASoUABsAPyl+uFOuKCWisAwBwCUJZQAAW+q+9Bpo4aAA/uvZ+YkAc4jvVTc7+oJAY99soPLjJTrwm3j5Y3VE0BWmGAA=';

/**
 * TournamentBackground - Background image layers component
 * 
 * @param props - Component props
 * @returns Background layers JSX
 */
export function TournamentBackground({
  backgroundImage,
  blurPlaceholder = BLUR_PLACEHOLDER,
  borderRadius,
  imageLoaded,
  useFallback,
  originalUrl,
}: TournamentBackgroundProps): React.ReactElement {
  // Determine which image to show based on fallback status
  const displayImageUrl = useFallback && originalUrl && 
    (originalUrl.endsWith('.webp') || originalUrl.includes('.webp'))
    ? backgroundImage?.replace('.webp', '.png').split('?')[0]
    : backgroundImage;

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
```

### Step 5: Create TournamentTitle Component

**File**: `components/vx2/tabs/lobby/elements/TournamentTitle.tsx`

```typescript
/**
 * TournamentTitle - Tournament title display
 * 
 * Renders the tournament title with custom typography.
 * Extracted from TournamentCardV3 TitleSection function.
 * 
 * @module TournamentTitle
 */

import React from 'react';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';
import type { TournamentTitleProps } from './types';

const CARD_COLORS = {
  textPrimary: '#FFFFFF',
} as const;

/**
 * TournamentTitle - Title component
 * 
 * @param props - Component props
 * @returns Title JSX
 */
export function TournamentTitle({
  title,
  fontSize,
  className = '',
}: TournamentTitleProps): React.ReactElement {
  const finalFontSize = fontSize ?? CARD_SPACING_V3.titleFontSize;
  
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
        className={`vx2-tournament-title-v3 ${className}`}
        style={{
          fontSize: `${finalFontSize}px`,
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
        {title}
      </h2>
    </div>
  );
}
```

### Step 6: Create TournamentProgressBar Component

**File**: `components/vx2/tabs/lobby/elements/TournamentProgressBar.tsx`

```typescript
/**
 * TournamentProgressBar - Progress indicator
 * 
 * Displays tournament fill progress with optional rendering.
 * Extracted from BottomSectionV3 progress bar section.
 * 
 * @module TournamentProgressBar
 */

import React from 'react';
import { ProgressBar } from '../../../components/shared';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';
import type { TournamentProgressBarProps } from './types';

const DEFAULT_PROGRESS_BG = 'rgba(55, 65, 81, 0.5)';

/**
 * TournamentProgressBar - Progress bar component
 * 
 * Only renders if maxEntries > 0
 * 
 * @param props - Component props
 * @returns Progress bar JSX or null
 */
export function TournamentProgressBar({
  currentEntries,
  maxEntries,
  backgroundColor,
}: TournamentProgressBarProps): React.ReactElement | null {
  // Only show if tournament has a max entry limit
  if (!maxEntries || maxEntries <= 0) {
    return null;
  }

  const fillPercentage = Math.round((currentEntries / maxEntries) * 100);
  const progressBg = backgroundColor ?? DEFAULT_PROGRESS_BG;

  return (
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
  );
}
```

### Step 7: Create TournamentJoinButton Component

**File**: `components/vx2/tabs/lobby/elements/TournamentJoinButton.tsx`

```typescript
/**
 * TournamentJoinButton - Join tournament button
 * 
 * Renders the join button with customizable background.
 * Extracted from BottomSectionV3 join button section.
 * 
 * @module TournamentJoinButton
 */

import React from 'react';
import { TILED_BG_STYLE } from '../../../draft-room/constants';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';
import type { TournamentJoinButtonProps } from './types';

/**
 * TournamentJoinButton - Join button component
 * 
 * @param props - Component props
 * @returns Join button JSX
 */
export function TournamentJoinButton({
  tournamentTitle,
  entryFee,
  onClick,
  backgroundImage,
  backgroundColor,
}: TournamentJoinButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className="vx2-tournament-button-v3"
      style={{
        // ----------------------------------------
        // Background (tiled or custom)
        // ----------------------------------------
        ...(backgroundImage ? {} : TILED_BG_STYLE),
        ...(backgroundImage
          ? {
              backgroundImage: backgroundImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}),
        ...(backgroundColor
          ? {
              backgroundColor: backgroundColor,
            }
          : {}),

        // ----------------------------------------
        // FIXED dimensions
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
      aria-label={`Join ${tournamentTitle} for ${entryFee}`}
    >
      Join Tournament
    </button>
  );
}
```

### Step 8: Create TournamentStats Component

**File**: `components/vx2/tabs/lobby/elements/TournamentStats.tsx`

```typescript
/**
 * TournamentStats - Statistics grid
 * 
 * Displays entry fee, total entries, and first place prize.
 * Extracted from BottomSectionV3 stats grid section.
 * 
 * @module TournamentStats
 */

import React from 'react';
import { CARD_SPACING_V3 } from '../constants/cardSpacingV3';
import type { TournamentStatsProps } from './types';

/**
 * StatItem - Single statistic display (value + label)
 */
function StatItem({ value, label }: { value: string; label: string }): React.ReactElement {
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

/**
 * TournamentStats - Stats grid component
 * 
 * @param props - Component props
 * @returns Stats grid JSX
 */
export function TournamentStats({
  entryFee,
  totalEntries,
  firstPlacePrize,
}: TournamentStatsProps): React.ReactElement {
  return (
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
      <StatItem value={entryFee} label="Entry" />
      <StatItem value={totalEntries} label="Entries" />
      <StatItem value={firstPlacePrize} label="1st Place" />
    </div>
  );
}
```

### Step 9: Create Barrel Export

**File**: `components/vx2/tabs/lobby/elements/index.ts`

```typescript
/**
 * Tournament Lobby Elements - Barrel Export
 * 
 * Centralized exports for all tournament lobby element components.
 * 
 * @module elements
 */

export { TournamentBackground } from './TournamentBackground';
export { TournamentTitle } from './TournamentTitle';
export { TournamentProgressBar } from './TournamentProgressBar';
export { TournamentJoinButton } from './TournamentJoinButton';
export { TournamentStats } from './TournamentStats';

export type {
  TournamentBackgroundProps,
  TournamentTitleProps,
  TournamentProgressBarProps,
  TournamentJoinButtonProps,
  TournamentStatsProps,
} from './types';
```

### Step 10: Restructure LobbyTabVX2

**File**: `components/vx2/tabs/lobby/LobbyTabVX2.tsx`

**Key Changes:**
1. Remove `TournamentCardV3` import
2. Import all new element components
3. Import `useTournamentImage` hook
4. Replace card wrapper with direct component composition
5. Maintain absolute positioning (16px margins)
6. Apply "Flex-in-Grid" layout directly

**Complete Implementation:**

```typescript
/**
 * LobbyTabVX2 - Tournament Lobby Tab
 * 
 * RESTRUCTURED: Uses decomposed components instead of TournamentCardV3
 * 
 * @module LobbyTabVX2
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTournaments, type Tournament } from '../../hooks/data';
import { BG_COLORS } from '../../core/constants/colors';
import { SPACING } from '../../core/constants/sizes';
import { EmptyState, ErrorState } from '../../components/shared';
import JoinTournamentModal from './JoinTournamentModal';
import { createScopedLogger } from '../../../../lib/clientLogger';
import { useCardHeight } from '../../hooks/ui/useCardHeight';
import { useTournamentImage } from './hooks/useTournamentImage';
import {
  TournamentBackground,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from './elements';
import { CARD_SPACING_V3, CARD_GRID_V3 } from './constants/cardSpacingV3';

const logger = createScopedLogger('[LobbyTab]');

// Constants
const LOBBY_PX = {
  containerPaddingX: SPACING.lg,
  containerPaddingY: SPACING.lg,
  listGap: SPACING.lg,
} as const;

const CARD_COLORS = {
  backgroundImage: 'url(/do_riding_football_III.webp)',
  backgroundImagePng: 'url(/do_riding_football_III.png)',
  backgroundFallback: '#0a0a1a',
  borderDefault: 'rgba(75, 85, 99, 0.5)',
  borderFeatured: '#1E3A5F',
} as const;

const BLUR_PLACEHOLDER = 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAABwAwCdASoUABsAPyl+uFOuKCWisAwBwCUJZQAAW+q+9Bpo4aAA/uvZ+YkAc4jvVTc7+oJAY99soPLjJTrwm3j5Y3VE0BWmGAA=';

// Types
export interface LobbyTabVX2Props {
  onJoinClick?: (tournamentId: string) => void;
}

// Main Component
export default function LobbyTabVX2({ 
  onJoinClick,
}: LobbyTabVX2Props): React.ReactElement {
  const router = useRouter();
  const { tournaments, isLoading, error, refetch } = useTournaments();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  // Calculate card dimensions using fixed pixel margins
  const {
    height: cardHeight,
    width: cardWidth,
    isReady: isCardHeightReady,
  } = useCardHeight({
    topMargin: 16,
    bottomMargin: 16,
    leftMargin: 16,
    rightMargin: 16,
    minHeight: 400,
    maxWidth: 420,
  });

  // Get featured tournament
  const featuredTournament = useMemo(
    () => tournaments.find(t => t.isFeatured) || tournaments[0],
    [tournaments]
  );

  // Image preloading
  const backgroundUrl = useMemo(() => {
    if (!featuredTournament) return null;
    const match = CARD_COLORS.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? match[1] : null;
  }, [featuredTournament]);

  const { imageLoaded, useFallback } = useTournamentImage(backgroundUrl);

  // Handlers
  const handleJoinClick = useCallback((tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      setSelectedTournament(tournament);
    }
    onJoinClick?.(tournamentId);
  }, [tournaments, onJoinClick]);

  const handleConfirmJoin = useCallback(async (options: { entries: number; autopilot: boolean }) => {
    if (!selectedTournament) return;
    
    setIsJoining(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      sessionStorage.setItem('topdog_joined_draft', 'true');
      sessionStorage.setItem('topdog_entry_count', options.entries.toString());
      sessionStorage.setItem('topdog_autopilot', options.autopilot.toString());
      router.push('/testing-grounds/vx2-draft-room');
    } catch (e) {
      logger.error('Failed to join tournament', e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsJoining(false);
      setSelectedTournament(null);
    }
  }, [selectedTournament, router]);

  const handleCloseModal = useCallback(() => {
    if (!isJoining) {
      setSelectedTournament(null);
    }
  }, [isJoining]);
  
  // Loading state
  if (isLoading && tournaments.length === 0) {
    return (
      <div 
        className="flex-1 overflow-y-auto"
        style={{ 
          padding: `${LOBBY_PX.containerPaddingY}px ${LOBBY_PX.containerPaddingX}px`,
          backgroundColor: BG_COLORS.primary,
        }}
      >
        {/* Loading skeleton */}
        <div style={{ height: '400px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '18px' }} />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        <ErrorState
          title="Failed to load tournaments"
          description={error}
          onRetry={refetch}
        />
      </div>
    );
  }
  
  // Empty state
  if (tournaments.length === 0) {
    return (
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        <EmptyState
          title="No Tournaments Available"
          description="Check back soon for upcoming tournaments"
          action={{
            label: 'Refresh',
            onClick: refetch,
            variant: 'secondary',
          }}
        />
      </div>
    );
  }
  
  // Success state - render decomposed components directly
  if (!featuredTournament || !isCardHeightReady || !cardHeight || !cardWidth) {
    return (
      <div 
        className="vx2-lobby-container"
        style={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: BG_COLORS.primary,
        }}
      >
        {/* Loading skeleton */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '420px',
            height: '400px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '18px',
          }}
        />
      </div>
    );
  }

  const borderColor = featuredTournament.isFeatured 
    ? CARD_COLORS.borderFeatured 
    : CARD_COLORS.borderDefault;
  const borderWidth = featuredTournament.isFeatured ? 3 : 1;

  return (
    <div 
      className="vx2-lobby-container"
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: BG_COLORS.primary,
      }}
      role="main"
      aria-label="Tournament lobby"
    >
      {/* Absolutely positioned container with 16px margins */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: CARD_COLORS.backgroundFallback,
          borderRadius: `${CARD_SPACING_V3.borderRadius}px`,
          border: `${borderWidth}px solid ${borderColor}`,
          overflow: 'hidden',
          contain: 'layout style paint',
          isolation: 'isolate',
        }}
      >
        {/* Background Layers */}
        <TournamentBackground
          backgroundImage={CARD_COLORS.backgroundImage}
          blurPlaceholder={BLUR_PLACEHOLDER}
          borderRadius={CARD_SPACING_V3.borderRadius}
          imageLoaded={imageLoaded}
          useFallback={useFallback}
          originalUrl={backgroundUrl}
        />

        {/* Content Grid - The Layout Engine */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateRows: CARD_GRID_V3.template,
            padding: `${CARD_SPACING_V3.outerPadding}px`,
            zIndex: 1,
            position: 'relative',
            contain: 'layout',
            overflow: 'hidden',
          }}
        >
          {/* Row 1: Title */}
          <TournamentTitle title={featuredTournament.title} />

          {/* Row 2: Spacer (Takes 1fr) */}
          <div
            style={{
              minHeight: `${CARD_SPACING_V3.spacerMinHeight}px`,
            }}
            aria-hidden="true"
          />

          {/* Row 3: Bottom Anchor */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              paddingBottom: 0,
              marginBottom: 0,
              minHeight: 0,
              gap: `${CARD_SPACING_V3.bottomRowGap}px`,
            }}
          >
            <TournamentProgressBar
              currentEntries={featuredTournament.currentEntries}
              maxEntries={featuredTournament.maxEntries}
            />
            <TournamentJoinButton
              tournamentTitle={featuredTournament.title}
              entryFee={featuredTournament.entryFee}
              onClick={() => handleJoinClick(featuredTournament.id)}
            />
            <TournamentStats
              entryFee={featuredTournament.entryFee}
              totalEntries={featuredTournament.totalEntries}
              firstPlacePrize={featuredTournament.firstPlacePrize}
            />
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {selectedTournament && (
        <JoinTournamentModal
          tournament={selectedTournament}
          onClose={handleCloseModal}
          onConfirm={handleConfirmJoin}
          isJoining={isJoining}
        />
      )}
    </div>
  );
}
```

### Step 11: Update Sandbox Page

**File**: `pages/testing-grounds/tournament-card-sandbox.js`

Add new sections for component isolation:

1. **Component Isolation Section** - Show each component separately
2. **Component Props Controls** - Individual controls for each component
3. **Composition View** - Show how components compose together
4. **Lobby Tab Simulation** - Simulate the actual lobby tab layout

(Full sandbox implementation would be extensive - see plan for details)

---

## ✅ Success Criteria

1. ✅ All card elements render correctly in LobbyTabVX2
2. ✅ Visual appearance matches current implementation exactly
3. ✅ All components are isolated and testable in sandbox
4. ✅ TypeScript types are complete and correct
5. ✅ No performance regressions
6. ✅ Accessibility maintained (ARIA labels, semantic HTML)
7. ✅ Documentation complete (JSDoc comments)
8. ✅ Device comparison still works
9. ✅ Image preloading works correctly
10. ✅ All interactions (join button, modal) work

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Compare before/after screenshots on all device sizes
- [ ] Verify spacing matches exactly (16px margins)
- [ ] Check background image loading and fade-in
- [ ] Verify title typography matches
- [ ] Check progress bar rendering (with/without)
- [ ] Verify button styling and interactions
- [ ] Check stats grid layout and spacing

### Functional Testing
- [ ] Join button click opens modal
- [ ] Modal interactions work correctly
- [ ] Image preloading with WebP fallback
- [ ] Progress bar shows correct percentage
- [ ] Stats display correct values
- [ ] Loading states work correctly
- [ ] Error states work correctly
- [ ] Empty states work correctly

### Device Testing
- [ ] iPhone SE (375x667)
- [ ] iPhone 13 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Test on actual devices if possible

### Performance Testing
- [ ] No layout shifts (CLS)
- [ ] Image loading is optimized
- [ ] No unnecessary re-renders
- [ ] CSS containment working

---

## 🚨 Risk Mitigation

### Visual Regression
- **Risk**: Components may not match exact appearance
- **Mitigation**: 
  - Maintain exact spacing constants
  - Test on all device sizes
  - Use pixel-perfect comparison tools
  - Keep TournamentCardV3 for reference

### Performance
- **Risk**: Additional components may impact performance
- **Mitigation**:
  - Use CSS containment
  - Optimize image loading
  - Memoize expensive calculations
  - Profile before/after

### Breaking Changes
- **Risk**: Changes may break existing functionality
- **Mitigation**:
  - Keep TournamentCardV3 for reference
  - Gradual migration approach
  - Comprehensive testing
  - Feature flag if needed

### Type Safety
- **Risk**: TypeScript errors may be introduced
- **Mitigation**:
  - Comprehensive type definitions
  - Strict TypeScript mode
  - Type checking in CI/CD

---

## 📚 Reference Materials

### Current Implementation
- `components/vx2/tabs/lobby/TournamentCardV3.tsx` - Reference implementation
- `components/vx2/tabs/lobby/TournamentCardBottomSectionV3.tsx` - Bottom section reference
- `components/vx2/tabs/lobby/constants/cardSpacingV3.ts` - Spacing constants

### Related Documentation
- `TOURNAMENT_CARD_V3_REBUILD_HANDOFF.md` - V3 rebuild documentation
- `FIXED_PIXEL_MARGIN_CARD_SIZING_HANDOFF.md` - Card sizing documentation

### Best Practices
- React Component Composition patterns
- TypeScript best practices
- Accessibility guidelines (WCAG 2.1)
- Performance optimization techniques

---

## 🔄 Migration Path

1. **Phase 1**: Create all new components (non-breaking)
2. **Phase 2**: Update sandbox to test components
3. **Phase 3**: Restructure LobbyTabVX2 (breaking change)
4. **Phase 4**: Test thoroughly
5. **Phase 5**: Mark TournamentCardV3 as deprecated
6. **Phase 6**: Remove TournamentCardV3 (future cleanup)

---

## 📝 Notes

- TournamentCardV3 should be kept for reference initially
- All components should be fully documented with JSDoc
- Sandbox page should allow testing all components in isolation
- Consider creating Storybook stories for components (future enhancement)
- All components should follow the same naming conventions
- Constants should remain unchanged to preserve visual appearance

---

**Status**: Ready for implementation  
**Next Steps**: Begin with Step 1 (Create Directory Structure) and proceed sequentially through all steps
