/**
 * LobbyTabVX2 - Tournament Lobby Tab
 *
 * RESTRUCTURED: Uses decomposed atomic components instead of TournamentCardV3.
 *
 * Architecture:
 * - Solid card background (no full-bleed image)
 * - TournamentCardLogo: Logo image inside card (not background)
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

// Atomic components
import {
  TournamentCardLogo,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from './elements';

// Shared components
import { EmptyState, ErrorState } from '../../../ui';

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
  /** Logo image path (public) — used as logo inside card, not background */
  logoImage: '/tournament_card_background.png',
  /** Card background (solid color only; no full-bleed image) */
  backgroundFallback: '#0a0a1a',
  /** Default border color */
  borderDefault: 'rgba(75, 85, 99, 0.5)',
  /** Featured tournament border color */
  borderFeatured: '#1E3A5F',
} as const;

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
  // Use useEffect (not useLayoutEffect) to ensure this runs after React hydration
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
  // Only compute after mount to prevent hydration mismatch
  const featuredTournament = useMemo(
    () => {
      if (!isMounted) return undefined;
      return tournaments.find(t => t.isFeatured) || tournaments[0];
    },
    [tournaments, isMounted]
  );

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
  // SERVER/CLIENT CONSISTENT RENDERING
  // ----------------------------------------
  // CRITICAL: Always render the same structure on server and client
  // On server: isMounted = false, so we render loading
  // On client initial: isMounted = false (before useEffect), so we render loading (matches server)
  // On client after mount: isMounted = true, then we check data/dimensions
  // This ensures perfect HTML matching during hydration
  const shouldShowLoading = !isMounted || 
    (isLoading && tournaments.length === 0) ||
    !featuredTournament || 
    !isCardHeightReady || 
    !cardHeight || 
    !cardWidth;
  
  if (shouldShowLoading) {
    return (
      <div 
        className="vx2-lobby-container" 
        style={containerStyle}
      >
        <LoadingState />
      </div>
    );
  }

  // ----------------------------------------
  // ERROR STATE (only after mount)
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
  // EMPTY STATE (only after mount and data loaded)
  // ----------------------------------------
  if (!isLoading && tournaments.length === 0) {
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
  // SUCCESS STATE - Render decomposed components
  // ----------------------------------------
  // At this point, we know:
  // - isMounted = true (client-side only)
  // - featuredTournament exists
  // - cardHeight and cardWidth are defined
  const borderColor = featuredTournament.isFeatured
    ? CARD_VISUALS.borderFeatured
    : CARD_VISUALS.borderDefault;
  const borderWidth = featuredTournament.isFeatured ? 3 : 1;

  // Ensure dimensions are numbers (TypeScript safety)
  const finalWidth = cardWidth ?? 390; // Fallback to iPhone 13 width
  const finalHeight = cardHeight ?? 600; // Fallback height

  // Render content (only reached after mount)
  return (
    <div
      className="vx2-lobby-container"
      style={containerStyle}
      role="main"
      aria-label="Tournament lobby"
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
          width: `${finalWidth}px`,
          height: `${finalHeight}px`,
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
      >
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
          {/* Row 1: Logo + Title (auto height) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TournamentCardLogo src={CARD_VISUALS.logoImage} alt="Tournament logo" maxHeight={72} />
            <TournamentTitle title={featuredTournament.title} />
          </div>

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
