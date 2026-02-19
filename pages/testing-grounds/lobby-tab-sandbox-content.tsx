/**
 * Lobby Tab Sandbox Content – canonical lobby view for the phone frame
 *
 * This is the source of truth for the lobby tab. The app's lobby tab uses this;
 * the sandbox page wraps it with dev controls (outline toggles, object visibility, etc).
 *
 * Used by:
 * - lobby-tab-sandbox.tsx (wraps with dev tools)
 * - LobbyTabVX2 when inPhoneFrame (app lobby tab imports from here)
 *
 * Layout follows LOBBY_TAB_SANDBOX_SPEC.
 */

import Image from 'next/image';
import React, { useState, useMemo } from 'react';

import type { Tournament } from '../../components/vx2/hooks/data';
import { LOBBY_TAB_SANDBOX_SPEC } from '../../components/vx2/tabs/lobby/constants/lobbyTabSandboxSpec';
import {
  TournamentCardLogo,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from '../../components/vx2/tabs/lobby/elements';

const SPEC = LOBBY_TAB_SANDBOX_SPEC;
const LOGO_IMAGE = '/tournament_card_background.png';
const GLOBE_IMAGE_PRIMARY = '/globe_optimized.jpeg';
const GLOBE_IMAGE_FALLBACK = '/globe_optimized.jpeg';

export type LobbyObjectId = 'logoTitle' | 'progressBar' | 'joinButton' | 'stats' | 'globe';

const DEFAULT_OBJECTS_IN_PHONE: Record<LobbyObjectId, boolean> = {
  logoTitle: true,
  progressBar: true,
  joinButton: true,
  stats: true,
  globe: true,
};

export interface LobbyTabSandboxContentProps {
  tournament: Tournament;
  onJoinClick: (tournamentId: string) => void;
  /** Sandbox dev tool overrides; when absent, use SPEC and outline enabled */
  outlineOverrides?: {
    on?: boolean;
    thickness?: number;
    inset?: number;
    radius?: number;
  };
  globeSizePx?: number;
  /** Which sections to show; default all true. Sandbox toggles these. */
  objectsInPhone?: Partial<Record<LobbyObjectId, boolean>>;
  /** When true and no objects visible, show "Add elements from the panel" (sandbox only) */
  showEmptyPrompt?: boolean;
  /** Sandbox state override; app does not pass this */
  stateOverride?: 'default' | 'loading' | 'error' | 'empty';
  /** Optional data attribute for outline debug (sandbox) */
  'data-outline-debug'?: string;
}

export function LobbyTabSandboxContent({
  tournament,
  onJoinClick,
  outlineOverrides,
  globeSizePx = SPEC.lobby.globe_size_px,
  objectsInPhone: objectsInPhonePartial,
  showEmptyPrompt = false,
  stateOverride = 'default',
  'data-outline-debug': dataOutlineDebug,
}: LobbyTabSandboxContentProps): React.ReactElement {
  const [globeSrc, setGlobeSrc] = useState<string>(GLOBE_IMAGE_PRIMARY);

  const objectsInPhone = useMemo(
    () => ({ ...DEFAULT_OBJECTS_IN_PHONE, ...objectsInPhonePartial }),
    [objectsInPhonePartial]
  );
  const hasAnyInPhone = (Object.keys(objectsInPhone) as LobbyObjectId[]).some(
    (k) => objectsInPhone[k]
  );

  const outlineOn = outlineOverrides?.on ?? SPEC.outline.enabled;
  const outlineThickness = outlineOverrides?.thickness ?? SPEC.outline.thickness_px;
  const outlineInset = outlineOverrides?.inset ?? SPEC.outline.inset_px;
  const outlineRadius = outlineOverrides?.radius ?? SPEC.outline.radius_px;

  const outlineStyle = outlineOn
    ? (() => {
        const marginFromEdge = Math.max(0, outlineInset - outlineThickness);
        const outline = SPEC.outline as { color?: string; extends_to_tab_bar?: boolean };
        const outlineColor = outline.color ?? '#3B82F6';
        return {
          marginTop: SPEC.safe_area_top_px + marginFromEdge,
          marginLeft: marginFromEdge,
          marginRight: marginFromEdge,
          marginBottom: marginFromEdge,
          border: `${outlineThickness}px solid ${outlineColor}`,
          borderRadius: outlineRadius,
          boxSizing: 'border-box' as const,
        };
      })()
    : {};

  const innerContent = () => {
    if (stateOverride === 'loading') {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 16,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 16,
            animation: 'pulse 2s infinite',
          }}
          aria-label="Loading"
        />
      );
    }
    if (stateOverride === 'error') {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <span style={{ color: '#EF4444', fontSize: 14 }}>Error state</span>
        </div>
      );
    }
    if (stateOverride === 'empty') {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <span style={{ color: '#9CA3AF', fontSize: 14 }}>Empty state</span>
        </div>
      );
    }
    // stateOverride === 'default'
    if (showEmptyPrompt && !hasAnyInPhone) {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            color: '#6B7280',
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          Add elements from the panel →
        </div>
      );
    }
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: `${SPEC.lobby.outer_padding_px}px`,
          gap: `${SPEC.lobby.bottom_row_gap_px}px`,
          minHeight: 0,
        }}
      >
        {objectsInPhone.logoTitle && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <TournamentCardLogo src={LOGO_IMAGE} alt="Tournament logo" maxHeight={60} />
            <div style={{ marginTop: 14, transform: 'translateY(-34px)' }}>
              <TournamentTitle title={tournament.title} fontSize={38} />
            </div>
          </div>
        )}
        {objectsInPhone.globe && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: globeSizePx,
              marginTop: '24px',
              transform: 'translateY(-24px)',
            }}
          >
            <Image
              src={globeSrc}
              alt="Globe"
              width={globeSizePx}
              height={globeSizePx}
              style={{
                objectFit: 'contain',
                display: 'block',
              }}
              onError={() => setGlobeSrc(GLOBE_IMAGE_FALLBACK)}
            />
          </div>
        )}
      </div>
    );
  };

  const showBottomStrip =
    stateOverride === 'default' &&
    (objectsInPhone.progressBar || objectsInPhone.joinButton || objectsInPhone.stats);

  const bottomStrip = showBottomStrip ? (
    <div
      style={{
        flexShrink: 0,
        padding: `0 ${SPEC.lobby.outer_padding_px}px ${SPEC.lobby.outer_padding_px}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPEC.lobby.bottom_row_gap_px,
      }}
    >
      {objectsInPhone.progressBar && (
        <div style={{ transform: 'translateY(-14px)' }}>
          <TournamentProgressBar
            currentEntries={tournament.currentEntries}
            maxEntries={tournament.maxEntries}
          />
        </div>
      )}
      {objectsInPhone.joinButton && (
        <div style={{ transform: 'translateY(-4px)' }}>
          <TournamentJoinButton onClick={() => onJoinClick(tournament.id)} label="Join Tournament" />
        </div>
      )}
      {objectsInPhone.stats && (
        <TournamentStats
          entryFee={tournament.entryFee}
          entries={tournament.totalEntries}
          prize={tournament.firstPlacePrize}
        />
      )}
    </div>
  ) : null;

  return (
    <>
      <div
        data-outline-debug={dataOutlineDebug}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...outlineStyle,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            paddingTop: SPEC.safe_area_top_px,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              transform: `scale(${SPEC.content_scale})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {innerContent()}
            </div>
          </div>
        </div>
      </div>
      {bottomStrip}
    </>
  );
}

/** Mock tournament so the page can prerender without props (used when this file is the route). */
const MOCK_TOURNAMENT: Tournament = {
  id: 'sandbox-content-1',
  title: 'THE TOPDOG INTERNATIONAL',
  entryFee: '$25',
  entryFeeCents: 2500,
  totalEntries: '571,480',
  currentEntries: 571480,
  maxEntries: 1000000,
  firstPlacePrize: '$2.1M',
  isFeatured: true,
  status: 'filling',
};

/**
 * Page wrapper for /testing-grounds/lobby-tab-sandbox-content.
 * Provides required props so prerender does not access tournament.currentEntries on undefined.
 */
function LobbyTabSandboxContentPage(): React.ReactElement {
  return (
    <LobbyTabSandboxContent
      tournament={MOCK_TOURNAMENT}
      onJoinClick={() => {}}
    />
  );
}

export default LobbyTabSandboxContentPage;
