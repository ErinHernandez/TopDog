/**
 * LobbyTabVX2 - Tournament Lobby Tab
 *
 * RESTRUCTURED: Uses decomposed atomic components instead of TournamentCardV3.
 *
 * Architecture:
 * - TournamentBackground: Background image with blur-up loading
 * - TournamentTitle: Title display with typography
 * - TournamentProgressBar: Entry progress indicator
 * - TournamentJoinButton: Primary action button
 * - TournamentStats: Entry/Entries/Prize grid
 *
 * Layout uses "Flex-in-Grid" pattern with fixed pixel margins (16px).
 * Card is absolutely positioned and centered within the container.
 *
 * @module LobbyTabVX2
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';

// Data hooks
import { useTournaments, type Tournament } from '../../hooks/data';

// UI hooks
import { useCardHeight } from '../../hooks/ui/useCardHeight';
import { useTournamentImage } from './hooks';

// Atomic components
import {
  TournamentBackground,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from './elements';

// Shared components
import { EmptyState, ErrorState } from '../../components/shared/feedback';

// Constants
import { CARD_SPACING_V3, CARD_GRID_V3 } from './constants/cardSpacingV3';
import { BG_COLORS } from '../../core/constants/colors';

// Modal
import JoinTournamentModal from './JoinTournamentModal';

// Logging
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[LobbyTab]');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Card visual constants
 */
const CARD_VISUALS = {
  /** Background image path */
  backgroundImage: '/do_riding_football_III.webp',
  /** Fallback PNG image */
  backgroundImagePng: '/do_riding_football_III.png',
  /** Fallback background color if images fail */
  backgroundFallback: '#0a0a1a',
  /** Default border color */
  borderDefault: 'rgba(75, 85, 99, 0.5)',
  /** Featured tournament border color */
  borderFeatured: '#1E3A5F',
} as const;

/**
 * Blur placeholder for progressive image loading
 * 92 bytes - displays instantly while full image loads
 */
const BLUR_PLACEHOLDER = 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAABwAwCdASoUABsAPyl+uFOuKCWisAwBwCUJZQAAW+q+9Bpo4aAA/uvZ+YkAc4jvVTc7+oJAY99soPLjJTrwm3j5Y3VE0BWmGAA=';

// ============================================================================
// TYPES
// ============================================================================

export interface LobbyTabVX2Props {
  /** Optional callback when join button is clicked */
  onJoinClick?: (tournamentId: string) => void;
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

function LoadingState(): React.ReactElement {
  return (
    <div
      className="vx2-lobby-loading"
      style={{
        position: 'absolute',
        top: '16px',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: `${CARD_SPACING_V3.borderRadius}px`,
        animation: 'pulse 2s infinite',
      }}
      aria-label="Loading tournament"
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LobbyTabVX2({
  onJoinClick,
}: LobbyTabVX2Props): React.ReactElement {
  const router = useRouter();

  // ----------------------------------------
  // Data fetching
  // ----------------------------------------
  const { tournaments, isLoading, error, refetch } = useTournaments();

  // ----------------------------------------
  // Local state
  // ----------------------------------------
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track mount state to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ----------------------------------------
  // Card dimensions (fixed pixel margins)
  // ----------------------------------------
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

  // ----------------------------------------
  // Get featured tournament (or first one)
  // ----------------------------------------
  const featuredTournament = useMemo(
    () => tournaments.find(t => t.isFeatured) || tournaments[0],
    [tournaments]
  );

  // ----------------------------------------
  // Image preloading
  // Only enable after mount to prevent hydration mismatch
  // ----------------------------------------
  const { isLoaded: imageLoaded } = useTournamentImage({
    image: CARD_VISUALS.backgroundImage,
    placeholder: BLUR_PLACEHOLDER,
    enabled: isMounted && Boolean(featuredTournament),
  });

  // ----------------------------------------
  // Handlers
  // ----------------------------------------
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
      // Simulate join delay (replace with actual API call)
      await new Promise(r => setTimeout(r, 1000));

      // Store join state for draft room
      sessionStorage.setItem('topdog_joined_draft', 'true');
      sessionStorage.setItem('topdog_entry_count', options.entries.toString());
      sessionStorage.setItem('topdog_autopilot', options.autopilot.toString());

      // Navigate to draft room
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

  // ----------------------------------------
  // Container style (shared across states)
  // ----------------------------------------
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '400px', // Ensure container has minimum height for loading state
    flex: 1, // Take available space in flex parent
    backgroundColor: BG_COLORS.primary,
  };

  // ----------------------------------------
  // CLIENT-SIDE ONLY RENDERING
  // ----------------------------------------
  // On server, always render loading state to ensure hydration match
  // On client, wait for mount before rendering any dynamic content
  if (!isMounted) {
    return (
      <div 
        className="vx2-lobby-container" 
        style={containerStyle}
        suppressHydrationWarning
      >
        <LoadingState />
      </div>
    );
  }

  // ----------------------------------------
  // LOADING STATE (client-side only)
  // ----------------------------------------
  if (isLoading && tournaments.length === 0) {
    logger.debug('Showing loading state', { isLoading, tournamentCount: tournaments.length });
    return (
      <div className="vx2-lobby-container" style={containerStyle}>
        <LoadingState />
      </div>
    );
  }

  // ----------------------------------------
  // ERROR STATE
  // ----------------------------------------
  if (error) {
    return (
      <div
        className="vx2-lobby-container flex-1 flex items-center justify-center"
        style={containerStyle}
      >
        <ErrorState
          title="Failed to load tournaments"
          description={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  // ----------------------------------------
  // EMPTY STATE
  // ----------------------------------------
  if (tournaments.length === 0) {
    return (
      <div
        className="vx2-lobby-container flex-1 flex items-center justify-center"
        style={containerStyle}
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

  // ----------------------------------------
  // WAITING FOR DIMENSIONS
  // ----------------------------------------
  // After mount, wait for dimensions to be calculated
  if (!featuredTournament || !isCardHeightReady || !cardHeight || !cardWidth) {
    logger.debug('Waiting for dimensions', { 
      hasFeaturedTournament: !!featuredTournament, 
      isCardHeightReady, 
      cardHeight, 
      cardWidth 
    });
    return (
      <div className="vx2-lobby-container" style={containerStyle}>
        <LoadingState />
      </div>
    );
  }

  // ----------------------------------------
  // SUCCESS STATE - Render decomposed components
  // ----------------------------------------
  const borderColor = featuredTournament.isFeatured
    ? CARD_VISUALS.borderFeatured
    : CARD_VISUALS.borderDefault;
  const borderWidth = featuredTournament.isFeatured ? 3 : 1;

  return (
    <div
      className="vx2-lobby-container"
      style={containerStyle}
      role="main"
      aria-label="Tournament lobby"
      suppressHydrationWarning
    >
      {/* Absolutely positioned card container with 16px margins */}
      <div
        className="vx2-lobby-card"
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
          backgroundColor: CARD_VISUALS.backgroundFallback,
          borderRadius: `${CARD_SPACING_V3.borderRadius}px`,
          border: `${borderWidth}px solid ${borderColor}`,
          overflow: 'hidden',
          contain: 'layout style paint',
          isolation: 'isolate',
        }}
        suppressHydrationWarning
      >
        {/* Background Layers */}
        <TournamentBackground
          image={CARD_VISUALS.backgroundImage}
          placeholder={BLUR_PLACEHOLDER}
          isLoaded={imageLoaded}
          borderRadius={CARD_SPACING_V3.borderRadius}
        />

        {/* Content Grid - The Layout Engine */}
        <div
          className="vx2-lobby-content"
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
          {/* Row 1: Title (auto height) */}
          <TournamentTitle title={featuredTournament.title} />

          {/* Row 2: Spacer (Takes 1fr - flexible space) */}
          <div
            className="vx2-lobby-spacer"
            style={{
              minHeight: `${CARD_SPACING_V3.spacerMinHeight}px`,
            }}
            aria-hidden="true"
          />

          {/* Row 3: Bottom Anchor (auto height) */}
          <div
            className="vx2-lobby-bottom"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: `${CARD_SPACING_V3.bottomRowGap}px`,
            }}
          >
            {/* Progress Bar (only if tournament has max entries) */}
            <TournamentProgressBar
              currentEntries={featuredTournament.currentEntries}
              maxEntries={featuredTournament.maxEntries}
            />

            {/* Join Button */}
            <TournamentJoinButton
              onClick={() => handleJoinClick(featuredTournament.id)}
              label="Join Tournament"
            />

            {/* Stats Grid */}
            <TournamentStats
              entryFee={featuredTournament.entryFee}
              entries={featuredTournament.totalEntries}
              prize={featuredTournament.firstPlacePrize}
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
