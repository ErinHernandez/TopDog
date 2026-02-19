/**
 * LobbyTabVX2 - Tournament Lobby Tab
 *
 * RESTRUCTURED: Uses decomposed atomic components instead of TournamentCardV3.
 *
 * Architecture:
 * - Solid card background (no full-bleed image)
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

import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

// Data hooks
import { createScopedLogger } from '../../../../lib/clientLogger';
import { draftSession } from '../../../../lib/draftSession';
import { useInPhoneFrame } from '../../../../lib/inPhoneFrameContext';
import { EmptyState, ErrorState } from '../../../ui';
import { LOBBY_THEME } from '../../core/constants/colors';
import { useTournaments, type Tournament } from '../../hooks/data';
import { useCardHeight } from '../../hooks/ui/useCardHeight';

// Atomic components
import { LOBBY_TAB_SANDBOX_SPEC, LOBBY_TAB_CURRENT_ITERATION } from './constants/lobbyTabSandboxSpec';
import {
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from './elements';
import JoinTournamentModal from './JoinTournamentModal';
import LobbyTabSandboxContent from './LobbyTabSandboxContent';
import styles from './LobbyTabVX2.module.css';
import { useWorkingLobbyConfig } from './workingLobbyConfig';

// Modal

// Logging

// Draft session management

// CSS Modules

const logger = createScopedLogger('[LobbyTab]');

// ============================================================================
// CONSTANTS
// ============================================================================

/** Globe image (no background); used in lobby layout */
const GLOBE_IMAGE = '/globe_optimized.jpeg';
/** When in phone frame: use LOBBY_TAB_SANDBOX_SPEC for px-per-px match with sandbox. */
const SPEC = LOBBY_TAB_SANDBOX_SPEC;

/** Card visuals from LOBBY_THEME (core/constants/colors) */
const CARD_VISUALS = {
  backgroundFallback: LOBBY_THEME.cardBgFallback,
  borderDefault: LOBBY_THEME.cardBorderDefault,
  borderFeatured: LOBBY_THEME.cardBorderFeatured,
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
      className={styles.loadingState}
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
  // Card dimensions (fixed pixel margins); skipped when in phone frame (use sandbox layout)
  // ----------------------------------------
  const inPhoneFrame = useInPhoneFrame();
  const workingConfig = useWorkingLobbyConfig();
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
  const isCardReady = isCardHeightReady;

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

  const handleConfirmJoin = useCallback(async (options: { entries: number; draftSpeed: 'fast' | 'slow' }) => {
    if (!selectedTournament) return;

    setIsJoining(true);
    try {
      // Simulate join delay (replace with actual API call)
      await new Promise(r => setTimeout(r, 1000));

      // Generate roomId (in production, this would come from API)
      const roomId = `room-${selectedTournament.id}-${Date.now()}`;

      // Store join state using centralized session management
      draftSession.join(roomId, {
        entries: options.entries,
        speed: options.draftSpeed,
      });

      // Navigate to draft room with options in query params for reliability
      router.push({
        pathname: '/testing-grounds/vx2-draft-room',
        query: {
          roomId,
          entries: options.entries,
          speed: options.draftSpeed,
        },
      });
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
  // Container classes
  // ----------------------------------------
  const containerClasses = inPhoneFrame
    ? `${styles.container} ${styles.inPhoneFrame}`
    : styles.container;

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
    (!inPhoneFrame && (!isCardReady || !cardHeight || !cardWidth));
  
  if (shouldShowLoading) {
    return (
      <div
        className={containerClasses}
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
        className={`${containerClasses} flex-1 flex items-center justify-center`}
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
        className={`${containerClasses} flex-1 flex items-center justify-center`}
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

  // Shared bottom strip (used in phone-frame layout; uses spec for px-per-px match)
  const bottomStrip = (
    <div
      className={styles.bottomStrip}
    >
      <div className={styles.progressBarWrapper}>
        <TournamentProgressBar
          currentEntries={featuredTournament.currentEntries}
          maxEntries={featuredTournament.maxEntries}
        />
      </div>
      <div className={styles.joinButtonWrapper}>
        <TournamentJoinButton
          onClick={() => handleJoinClick(featuredTournament.id)}
          label="Join Tournament"
        />
      </div>
      <TournamentStats
        entryFee={featuredTournament.entryFee}
        entries={featuredTournament.totalEntries}
        prize={featuredTournament.firstPlacePrize}
      />
    </div>
  );

  const joinModal = selectedTournament && (
    <JoinTournamentModal
      tournament={selectedTournament}
      onClose={handleCloseModal}
      onConfirm={handleConfirmJoin}
      isJoining={isJoining}
    />
  );

  // In phone frame: use working lobby config if saved from sandbox, else current iteration.
  if (inPhoneFrame) {
    const base = { ...LOBBY_TAB_CURRENT_ITERATION };
    const w = workingConfig;
    const props = w
      ? {
          ...base,
          ...(w.outlineOn !== undefined || w.outlineThickness !== undefined || w.outlineInset !== undefined || w.outlineRadius !== undefined
            ? {
                outlineOverrides: {
                  on: w.outlineOn ?? base.outlineOverrides?.on,
                  thickness: w.outlineThickness ?? base.outlineOverrides?.thickness,
                  inset: w.outlineInset ?? base.outlineOverrides?.inset,
                  radius: w.outlineRadius ?? base.outlineOverrides?.radius,
                },
              }
            : {}),
          ...(w.globeSizePx != null && { globeSizePx: w.globeSizePx }),
          ...(w.objectsInPhone != null && { objectsInPhone: w.objectsInPhone }),
          ...(w.positionYOffsets != null && Object.keys(w.positionYOffsets).length > 0
            ? { positionOverrides: Object.fromEntries(Object.entries(w.positionYOffsets).map(([k, v]) => [k, { y: v }])) }
            : {}),
        }
      : base;
    return (
      <div
        className={containerClasses}
        role="main"
        aria-label="Tournament lobby"
      >
        <LobbyTabSandboxContent
          tournament={featuredTournament}
          onJoinClick={handleJoinClick}
          {...props}
        />
        {joinModal}
      </div>
    );
  }

  // Default: centered card layout
  const cardClasses = `${styles.card}${featuredTournament.isFeatured ? ` ${styles.featured}` : ''}`;

  // Set CSS custom properties for dynamic values
  const cardStyle: React.CSSProperties = {
    '--card-width': `${finalWidth}px`,
    '--card-height': `${finalHeight}px`,
  } as React.CSSProperties & Record<string, any>;

  return (
    <div
      className={containerClasses}
      role="main"
      aria-label="Tournament lobby"
    >
      <div
        className={cardClasses}
        style={cardStyle}
      >
        <div
          className={styles.content}
        >
          <div
            className={styles.scrollableContent}
          >
            <div
              className={styles.contentPadding}
            >
              <div className={styles.logoSection}>
                <div className={styles.titleWrapper}>
                  <TournamentTitle title={featuredTournament.title} fontSize={38} />
                </div>
              </div>
              <div
                className={styles.globeSection}
              >
                <Image
                  src={GLOBE_IMAGE}
                  alt=""
                  width={SPEC.lobby.globe_size_px}
                  height={SPEC.lobby.globe_size_px}
                  className={styles.globeImage}
                  unoptimized
                />
              </div>
            </div>
          </div>
          {bottomStrip}
        </div>
      </div>
      {joinModal}
    </div>
  );
}
