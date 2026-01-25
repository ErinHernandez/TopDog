/**
 * Lobby Tab Sandbox Content – canonical lobby view for the phone frame
 *
 * Single source of truth for the lobby tab UI. The sandbox page uses this with
 * dev overrides (outline, object visibility, etc.); the app lobby tab uses it
 * with default props when inPhoneFrame.
 *
 * Used by:
 * - lobby-tab-sandbox.tsx (wraps with dev tools, passes outlineOverrides, etc.)
 * - LobbyTabVX2 when inPhoneFrame (app lobby tab)
 *
 * Layout follows LOBBY_TAB_SANDBOX_SPEC.
 */

import React, { useState, useMemo } from 'react';
import type { Tournament } from '../../hooks/data';
import {
  TournamentCardLogo,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from './elements';
import { LOBBY_TAB_SANDBOX_SPEC } from './constants/lobbyTabSandboxSpec';

const SPEC = LOBBY_TAB_SANDBOX_SPEC;
const LOGO_IMAGE = '/tournament_card_background.png';
const GLOBE_IMAGE_PRIMARY = '/!!_GLOBE_NOBACKGROUND.png';
const GLOBE_IMAGE_FALLBACK = '/!!_GLOBE_NOBACKGROUND.png';

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
  /** When set (e.g. 1), overrides SPEC.content_scale so the globe and content are not scaled (sandbox debugging) */
  contentScaleOverride?: number;
  /** When set (sandbox), use this URL for the globe so phone and panel share the same working asset */
  globeImageSrc?: string;
  /** When false (sandbox), the lobby content does not scroll; overflow is hidden. Default true. */
  scrollable?: boolean;
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
  contentScaleOverride,
  globeImageSrc: globeImageSrcProp,
  scrollable = true,
}: LobbyTabSandboxContentProps): React.ReactElement {
  const contentScale = contentScaleOverride ?? SPEC.content_scale;
  const [globeSrc, setGlobeSrc] = useState<string>(GLOBE_IMAGE_PRIMARY);
  const globeUrl = globeImageSrcProp ?? globeSrc;

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

  /** Outline wraps the hero block only: title, globe, join button, stats */
  const heroOutlineStyle = outlineOn
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
    const hasHeroContent =
      objectsInPhone.logoTitle ||
      objectsInPhone.globe ||
      objectsInPhone.progressBar ||
      objectsInPhone.joinButton ||
      objectsInPhone.stats;
    const heroBlock = (
      <div
        data-outline-debug={dataOutlineDebug}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${SPEC.lobby.outer_padding_px}px`,
          gap: `${SPEC.lobby.bottom_row_gap_px}px`,
          ...(hasHeroContent ? heroOutlineStyle : {}),
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
              width: '100%',
              flexShrink: 0,
              marginTop: '24px',
              transform: 'translateY(-24px)',
            }}
          >
            <div
              data-globe-slot
              role="img"
              aria-label="Globe"
              style={{
                width: globeSizePx,
                height: globeSizePx,
                minWidth: globeSizePx,
                minHeight: globeSizePx,
                maxWidth: '100%',
                flexShrink: 0,
                backgroundImage: `url(${globeUrl})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            />
          </div>
        )}
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
    );
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'min-content',
        }}
      >
        {heroBlock}
      </div>
    );
  };

  const bottomStrip = null;

  return (
    <>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
              transform: `scale(${contentScale})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: scrollable ? 'auto' : 'hidden',
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

export default LobbyTabSandboxContent;
