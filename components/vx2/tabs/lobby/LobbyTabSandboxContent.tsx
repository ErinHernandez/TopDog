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

import { STATE_COLORS } from '../../core/constants/colors';
import type { Tournament } from '../../hooks/data';

import { LOBBY_TAB_SANDBOX_SPEC } from './constants/lobbyTabSandboxSpec';
import {
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from './elements';
import styles from './LobbyTabSandboxContent.module.css';

const SPEC = LOBBY_TAB_SANDBOX_SPEC;
const GLOBE_IMAGE_PRIMARY = '/!!_GLOBE_NOBACKGROUND.webp';
const GLOBE_IMAGE_FALLBACK = '/!!_GLOBE_NOBACKGROUND.webp';
/** Fixed height for the globe area so resizing the globe does not shift other lobby content. Sized so all lobby objects fit in the content area (731px). */
const GLOBE_SLOT_HEIGHT_PX = 280;

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
  /** Dev position offsets in px (additive). Y = height movement. Sandbox only. */
  positionOverrides?: Partial<Record<LobbyObjectId | 'outline', { x?: number; y?: number }>>;
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
  positionOverrides,
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

  /** Outline wraps the full content area (from content top down to top of footer).
   * Inset = distance from content-area edges; at 0px the outline reaches the edge of the footer tabs. */
  const marginFromEdge = outlineOn ? Math.max(0, outlineInset - outlineThickness) : 0;
  const outlineColor = (SPEC.outline as { color?: string }).color ?? STATE_COLORS.info;

  const innerContent = () => {
    if (stateOverride === 'loading') {
      return (
        <div
          className={styles.loadingPlaceholder}
          aria-label="Loading"
        />
      );
    }
    if (stateOverride === 'error') {
      return (
        <div className={styles.errorContainer}>
          <span className={styles.errorText}>Error state</span>
        </div>
      );
    }
    if (stateOverride === 'empty') {
      return (
        <div className={styles.emptyContainer}>
          <span className={styles.emptyText}>Empty state</span>
        </div>
      );
    }
    // stateOverride === 'default'
    if (showEmptyPrompt && !hasAnyInPhone) {
      return (
        <div className={styles.emptyPrompt}>
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
    // CSS custom property styles for each element
    const heroBlockStyle = {
      '--outer-padding': `${SPEC.lobby.outer_padding_px}px`,
      '--bottom-row-gap': `${SPEC.lobby.bottom_row_gap_px}px`,
    } as React.CSSProperties;

    const logoTitleStyle = {
      '--logo-title-translate-x': `${positionOverrides?.logoTitle?.x ?? 0}px`,
      '--logo-title-translate-y': `${positionOverrides?.logoTitle?.y ?? 0}px`,
    } as React.CSSProperties;

    const globeContainerStyle = {
      '--globe-slot-height': `${GLOBE_SLOT_HEIGHT_PX}px`,
      '--globe-translate-x': `${positionOverrides?.globe?.x ?? 0}px`,
      '--globe-translate-y': `${positionOverrides?.globe?.y ?? 0}px`,
    } as React.CSSProperties;

    const globeSlotStyle = {
      '--globe-size': `${globeSizePx}px`,
      '--globe-bg-image': `url(${globeUrl})`,
    } as React.CSSProperties;

    const progressBarStyle = {
      '--progress-bar-translate-x': `${positionOverrides?.progressBar?.x ?? 0}px`,
      '--progress-bar-translate-y': `${positionOverrides?.progressBar?.y ?? 0}px`,
    } as React.CSSProperties;

    const joinButtonStyle = {
      '--join-button-translate-x': `${positionOverrides?.joinButton?.x ?? 0}px`,
      '--join-button-translate-y': `${positionOverrides?.joinButton?.y ?? 0}px`,
    } as React.CSSProperties;

    const statsStyle = {
      '--stats-translate-x': `${positionOverrides?.stats?.x ?? 0}px`,
      '--stats-translate-y': `${positionOverrides?.stats?.y ?? 0}px`,
    } as React.CSSProperties;

    const heroBlock = (
      <div className={styles.heroBlock} style={heroBlockStyle}>
        {objectsInPhone.logoTitle && (
          <div className={styles.logoTitleContainer} style={logoTitleStyle}>
            <div className={styles.logoTitleInner}>
              <TournamentTitle title={tournament.title} fontSize={38} />
            </div>
          </div>
        )}
        {objectsInPhone.globe && (
          <div className={styles.globeSlotContainer} style={globeContainerStyle}>
            <div
              role="img"
              aria-label="Globe"
              className={styles.globeSlot}
              style={globeSlotStyle}
            />
          </div>
        )}
        {objectsInPhone.progressBar && (
          <div className={styles.progressBarContainer} style={progressBarStyle}>
            <TournamentProgressBar
              currentEntries={tournament.currentEntries}
              maxEntries={tournament.maxEntries}
            />
          </div>
        )}
        {objectsInPhone.joinButton && (
          <div className={styles.joinButtonContainer} style={joinButtonStyle}>
            <TournamentJoinButton onClick={() => onJoinClick(tournament.id)} label="Join Tournament" />
          </div>
        )}
        {objectsInPhone.stats && (
          <div className={styles.statsContainer} style={statsStyle}>
            <TournamentStats
              entryFee={tournament.entryFee}
              entries={tournament.totalEntries}
              prize={tournament.firstPlacePrize}
            />
          </div>
        )}
      </div>
    );
    return (
      <div className={styles.contentWrapper}>
        {heroBlock}
      </div>
    );
  };

  const bottomStrip = null;

  const outlineY = positionOverrides?.outline?.y ?? 0;

  // Pass CSS custom properties via inline style for CSP compliance
  const contentAreaStyle = {
    '--lobby-outline-thickness': outlineOn ? `${outlineThickness}px` : '0px',
    '--lobby-outline-margin': `${marginFromEdge}px`,
    '--lobby-outline-radius': `${outlineRadius}px`,
    '--outline-translate-y': `${outlineY}px`,
    '--content-scale': contentScale.toString(),
    '--safe-area-top': `${SPEC.safe_area_top_px}px`,
  } as React.CSSProperties;

  return (
    <>
      <div
        data-outline-debug={dataOutlineDebug}
        className={`${styles.contentArea} ${outlineOn ? styles.outlineEnabled : ''}`}
        style={contentAreaStyle}
      >
        <div className={styles.safeAreaWrapper}>
          <div className={styles.scaleWrapper}>
            <div
              className={`${styles.scrollContainer} ${!scrollable ? styles.noScroll : ''}`}
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
