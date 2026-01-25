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
import { useInPhoneFrame } from '../../../../lib/inPhoneFrameContext';

// Atomic components
import {
  TournamentCardLogo,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from './elements';
import LobbyTabSandboxContent from './LobbyTabSandboxContent';

// Shared components
import { EmptyState, ErrorState } from '../../../ui';

// Constants
import { CARD_SPACING_V3 } from './constants/cardSpacingV3';
import { LOBBY_TAB_SANDBOX_SPEC, LOBBY_TAB_CURRENT_ITERATION } from './constants/lobbyTabSandboxSpec';
import { useWorkingLobbyConfig } from './workingLobbyConfig';
import { BG_COLORS } from '../../core/constants/colors';

// Modal
import JoinTournamentModal from './JoinTournamentModal';

// Logging
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[LobbyTab]');

// ============================================================================
// CONSTANTS
// ============================================================================

/** Globe image (no background); used in lobby layout */
const GLOBE_IMAGE = '/!!_GLOBE_NOBACKGROUND.png';
/** When in phone frame: use LOBBY_TAB_SANDBOX_SPEC for px-per-px match with sandbox. */
const SPEC = LOBBY_TAB_SANDBOX_SPEC;

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
    minHeight: inPhoneFrame ? 0 : '400px', // In phone frame: shrink so border + bottom strip layout correctly
    flex: 1,
    backgroundColor: BG_COLORS.primary,
    // In phone frame: flex column so border wrapper is height-constrained and bottom strip (progress, join, stats) stays visible
    ...(inPhoneFrame ? { display: 'flex', flexDirection: 'column' as const } : {}),
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
    (!inPhoneFrame && (!isCardReady || !cardHeight || !cardWidth));
  
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

  // Shared bottom strip (used in phone-frame layout; uses spec for px-per-px match)
  const bottomStrip = (
    <div
      className="vx2-lobby-bottom"
      style={{
        flexShrink: 0,
        padding: `0 ${SPEC.lobby.outer_padding_px}px ${SPEC.lobby.outer_padding_px}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPEC.lobby.bottom_row_gap_px,
      }}
    >
      <div style={{ transform: 'translateY(-14px)' }}>
        <TournamentProgressBar
          currentEntries={featuredTournament.currentEntries}
          maxEntries={featuredTournament.maxEntries}
        />
      </div>
      <div style={{ transform: 'translateY(-4px)' }}>
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
        className="vx2-lobby-container"
        style={containerStyle}
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
  return (
    <div
      className="vx2-lobby-container"
      style={containerStyle}
      role="main"
      aria-label="Tournament lobby"
    >
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
        <div
          className="vx2-lobby-content"
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1,
            position: 'relative',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: `${CARD_SPACING_V3.outerPadding}px`,
                gap: CARD_SPACING_V3.bottomRowGap,
                minHeight: 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TournamentCardLogo src={CARD_VISUALS.logoImage} alt="Tournament logo" maxHeight={60} />
                <div style={{ marginTop: 14, transform: 'translateY(-24px)' }}>
                  <TournamentTitle title={featuredTournament.title} fontSize={38} />
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: SPEC.lobby.globe_size_px,
                  marginTop: 24,
                  transform: 'translateY(-24px)',
                }}
              >
                <img
                  src={GLOBE_IMAGE}
                  alt=""
                  width={SPEC.lobby.globe_size_px}
                  height={SPEC.lobby.globe_size_px}
                  style={{ width: SPEC.lobby.globe_size_px, height: SPEC.lobby.globe_size_px, objectFit: 'contain', display: 'block' }}
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
