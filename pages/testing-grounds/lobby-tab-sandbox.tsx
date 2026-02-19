/**
 * Lobby Tab Sandbox - Testing Grounds Page
 *
 * Isolated environment for the Lobby tab. Phone shows only the footer by default;
 * all lobby content (logo, title, progress bar, join button, stats) lives in a
 * right-hand "Lobby objects" panel. Toggle "Show in phone" to add objects back
 * into the phone one at a time.
 *
 * Outline dev tool: In-browser panel with "Show" toggle and sliders for thickness
 * and inset. Draws an outline with four equal sides around content above the footer.
 * Footer tabs are never altered.
 *
 * Access: /testing-grounds/lobby-tab-sandbox
 */

import dynamic from 'next/dynamic';
import Head from 'next/head';
import Image from 'next/image';
import React, { useState, useCallback } from 'react';

import { AuthProvider } from '../../components/vx2/auth';
import { TabNavigationProvider, useTabNavigation } from '../../components/vx2/core';
import { BG_COLORS } from '../../components/vx2/core/constants';
import type { TabId } from '../../components/vx2/core/types';
import type { Tournament } from '../../components/vx2/hooks/data';
import { TabBarVX2 } from '../../components/vx2/navigation';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { LOBBY_TAB_SANDBOX_SPEC } from '../../components/vx2/tabs/lobby/constants/lobbyTabSandboxSpec';
import {
  TournamentCardLogo,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from '../../components/vx2/tabs/lobby/elements';
import JoinTournamentModal from '../../components/vx2/tabs/lobby/JoinTournamentModal';
import { LobbyTabSandboxContent } from '../../components/vx2/tabs/lobby/LobbyTabSandboxContent';
import { saveWorkingLobbyConfig } from '../../components/vx2/tabs/lobby/workingLobbyConfig';
import { InPhoneFrameProvider } from '../../lib/inPhoneFrameContext';

const DraftsTab = dynamic(
  () => import('../../components/vx2/tabs/live-drafts').then((m) => ({ default: m.DraftsTabVX2 })),
  { ssr: false }
);
const MyTeamsTab = dynamic(
  () => import('../../components/vx2/tabs/my-teams').then((m) => ({ default: m.MyTeamsTabVX2 })),
  { ssr: false }
);
const ExposureTab = dynamic(
  () => import('../../components/vx2/tabs/exposure').then((m) => ({ default: m.ExposureTabVX2 })),
  { ssr: false }
);
const ProfileTab = dynamic(
  () => import('../../components/vx2/tabs/profile').then((m) => ({ default: m.ProfileTabVX2 })),
  { ssr: false }
);

const TAB_COMPONENTS: Record<TabId, React.ComponentType<object>> = {
  lobby: () => null,
  'live-drafts': DraftsTab,
  'my-teams': MyTeamsTab,
  exposure: ExposureTab,
  profile: ProfileTab,
};

function SandboxPhoneBody({ children }: { children: React.ReactNode }): React.ReactElement {
  const { state } = useTabNavigation();
  if (state.activeTab === 'lobby') {
    return <>{children}</>;
  }
  const TabComponent = TAB_COMPONENTS[state.activeTab];
  if (!TabComponent) {
    return (
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#9CA3AF', fontSize: 14 }}>
        Unknown tab
      </div>
    );
  }
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TabComponent />
    </div>
  );
}

const PAGE_BG = '#1a1a2e';
const LOGO_IMAGE = '/tournament_card_background.png';

const SPEC = LOBBY_TAB_SANDBOX_SPEC;
/** Globe image (no background) */
const GLOBE_IMAGE_PRIMARY = '/!!_GLOBE_NOBACKGROUND.webp';
const GLOBE_IMAGE_FALLBACK = '/!!_GLOBE_NOBACKGROUND.webp';

const MOCK_TOURNAMENT: Tournament = {
  id: 'sandbox-1',
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

const SAVE_KEY = 'lobby-tab-sandbox-config';
const BACKUP_KEY = 'lobby-tab-sandbox-config-backup';

type LobbyObjectId = 'logoTitle' | 'progressBar' | 'joinButton' | 'stats' | 'globe';
type PositionTarget = LobbyObjectId | 'outline';

const POSITION_TARGETS: PositionTarget[] = ['logoTitle', 'progressBar', 'joinButton', 'stats', 'globe', 'outline'];

type SandboxConfig = {
  stateOverride: 'default' | 'loading' | 'error' | 'empty';
  objectsInPhone: Record<LobbyObjectId, boolean>;
  outlineOn: boolean;
  outlineThickness: number;
  outlineInset: number;
  outlineRadius: number;
  globeSizePx: number;
  /** Y offset in px (height movement) per lobby object + outline. */
  positionYOffsets?: Partial<Record<PositionTarget, number>>;
};

const OBJECT_LABELS: Record<LobbyObjectId, string> = {
  logoTitle: 'Logo + Title',
  progressBar: 'Progress bar',
  joinButton: 'Join button',
  stats: 'Stats',
  globe: 'Globe (no background)',
};

const POSITION_Y_LABELS: Record<PositionTarget, string> = {
  ...OBJECT_LABELS,
  outline: 'Outline',
};

const DEFAULT_POSITION_Y: Record<PositionTarget, number> = {
  logoTitle: 0,
  progressBar: 0,
  joinButton: 0,
  stats: 0,
  globe: 0,
  outline: 0,
};

/** Copy icon (outline) for clipboard actions. */
function CopyIcon({ size = 18 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ObjectToggle({
  id,
  label,
  checked,
  onToggle,
  children,
}: {
  id: LobbyObjectId;
  label: string;
  checked: boolean;
  onToggle: (id: LobbyObjectId) => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        borderRadius: 8,
        border: `1px solid ${checked ? '#3B82F6' : '#374151'}`,
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          cursor: 'pointer',
          color: '#F9FAFB',
          fontWeight: 500,
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(id)}
          style={{ width: 18, height: 18, accentColor: '#3B82F6' }}
          aria-label={`Show ${label} in phone`}
        />
        <span>Show in phone</span>
      </label>
      <div style={{ padding: '12px 0', minHeight: 40 }}>{children}</div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  commitOnRelease = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  /** When true, only call onChange on pointer up; prevents layout thrash while dragging */
  commitOnRelease?: boolean;
}): React.ReactElement {
  const [live, setLive] = useState(value);
  const isControlled = !commitOnRelease;

  React.useEffect(() => {
    if (value !== live) setLive(value);
  }, [value, live]);

  const handleChange = (n: number) => {
    setLive(n);
    if (isControlled) onChange(n);
  };

  const handlePointerUp = () => {
    if (commitOnRelease && live !== value) onChange(live);
  };

  const display = isControlled ? value : live;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: '#E5E7EB', fontSize: 12 }}>{label}</span>
        <span style={{ color: '#9CA3AF', fontSize: 12, minWidth: 28, textAlign: 'right' }}>{display}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={display}
        onChange={(e) => handleChange(Number(e.target.value))}
        onMouseUp={commitOnRelease ? handlePointerUp : undefined}
        onTouchEnd={commitOnRelease ? handlePointerUp : undefined}
        style={{ width: '100%', accentColor: '#3B82F6' }}
        aria-label={label}
      />
    </div>
  );
}

const defaultObjectsInPhone: Record<LobbyObjectId, boolean> = {
  logoTitle: false,
  progressBar: false,
  joinButton: false,
  stats: false,
  globe: false,
};

function loadSavedConfig(): Partial<SandboxConfig> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<SandboxConfig>;
  } catch {
    return null;
  }
}

function loadBackupConfig(): Partial<SandboxConfig> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<SandboxConfig>;
  } catch {
    return null;
  }
}

function applyConfig(
  setStateOverride: (v: SandboxConfig['stateOverride']) => void,
  setObjectsInPhone: (v: Record<LobbyObjectId, boolean> | ((prev: Record<LobbyObjectId, boolean>) => Record<LobbyObjectId, boolean>)) => void,
  setOutlineOn: (v: boolean) => void,
  setOutlineThickness: (v: number) => void,
  setOutlineInset: (v: number) => void,
  setOutlineRadius: (v: number) => void,
  setGlobeSizePx: (v: number) => void,
  setPositionYOffsets: (v: Record<PositionTarget, number> | ((prev: Record<PositionTarget, number>) => Record<PositionTarget, number>)) => void,
  saved: Partial<SandboxConfig> | null
): void {
  if (!saved) return;
  if (saved.stateOverride != null) setStateOverride(saved.stateOverride);
  if (saved.objectsInPhone != null) setObjectsInPhone({ ...defaultObjectsInPhone, ...saved.objectsInPhone });
  if (saved.outlineOn != null) setOutlineOn(saved.outlineOn);
  if (saved.outlineThickness != null) setOutlineThickness(saved.outlineThickness);
  if (saved.outlineInset != null) setOutlineInset(saved.outlineInset);
  if (saved.outlineRadius != null) setOutlineRadius(saved.outlineRadius);
  if (saved.globeSizePx != null) setGlobeSizePx(saved.globeSizePx);
  if (saved.positionYOffsets != null) setPositionYOffsets({ ...DEFAULT_POSITION_Y, ...saved.positionYOffsets });
}

export default function LobbyTabSandboxPage(): React.ReactElement {
  const [stateOverride, setStateOverride] = useState<'default' | 'loading' | 'error' | 'empty'>('default');
  const [objectsInPhone, setObjectsInPhone] = useState<Record<LobbyObjectId, boolean>>(defaultObjectsInPhone);
  const [globeSrc, setGlobeSrc] = useState<string>(GLOBE_IMAGE_PRIMARY);
  const [outlineOn, setOutlineOn] = useState<boolean>(SPEC.outline.enabled);
  const [outlineThickness, setOutlineThickness] = useState<number>(SPEC.outline.thickness_px);
  const [outlineInset, setOutlineInset] = useState<number>(SPEC.outline.inset_px);
  const [outlineRadius, setOutlineRadius] = useState<number>(SPEC.outline.radius_px);
  const [globeSizePx, setGlobeSizePx] = useState<number>(SPEC.lobby.globe_size_px);
  const [positionYOffsets, setPositionYOffsets] = useState<Record<PositionTarget, number>>(DEFAULT_POSITION_Y);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [undoneAt, setUndoneAt] = useState<number | null>(null);
  const [hasBackup, setHasBackup] = useState(false);
  const [copiedAt, setCopiedAt] = useState<number | null>(null);
  const [joinModalTournament, setJoinModalTournament] = useState<Tournament | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClick = useCallback((tournamentId: string) => {
    if (tournamentId === MOCK_TOURNAMENT.id) setJoinModalTournament(MOCK_TOURNAMENT);
  }, []);

  const handleCloseJoinModal = useCallback(() => {
    setJoinModalTournament(null);
  }, []);

  const handleConfirmJoin = useCallback(
    (options: { entries: number; draftSpeed: 'fast' | 'slow' }) => {
      void options; // Acknowledge options for sandbox testing
      setIsJoining(true);
      setTimeout(() => {
        setIsJoining(false);
        setJoinModalTournament(null);
      }, 600);
    },
    [],
  );

  const dimensionsSpec = React.useMemo(() => {
    const s = {
      handoff: SPEC.handoff,
      phone_frame: { ...SPEC.phone_frame },
      content_area_above_tab_bar: { ...SPEC.content_area_above_tab_bar },
      tab_bar_height_px: SPEC.tab_bar_height_px,
      safe_area_top_px: SPEC.safe_area_top_px,
      content_scale: SPEC.content_scale,
      outline: {
        enabled: outlineOn,
        inset_px: outlineInset,
        thickness_px: outlineThickness,
        radius_px: outlineRadius,
      },
      lobby: {
        outer_padding_px: SPEC.lobby.outer_padding_px,
        bottom_row_gap_px: SPEC.lobby.bottom_row_gap_px,
        globe_size_px: globeSizePx,
      },
    };
    return JSON.stringify(s, null, 2);
  }, [outlineOn, outlineInset, outlineThickness, outlineRadius, globeSizePx]);

  const copyDimensionsSpec = () => {
    navigator.clipboard.writeText(dimensionsSpec).then(
      () => {
        setCopiedAt(Date.now());
      },
      () => {},
    );
  };

  React.useEffect(() => {
    applyConfig(
      setStateOverride,
      setObjectsInPhone,
      setOutlineOn,
      setOutlineThickness,
      setOutlineInset,
      setOutlineRadius,
      setGlobeSizePx,
      setPositionYOffsets,
      loadSavedConfig()
    );
  }, []);

  React.useEffect(() => {
    setHasBackup(loadBackupConfig() != null);
  }, []);

  const toggleInPhone = (id: LobbyObjectId) => {
    setObjectsInPhone((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const saveConfig = () => {
    const config: SandboxConfig = {
      stateOverride,
      objectsInPhone,
      outlineOn,
      outlineThickness,
      outlineInset,
      outlineRadius,
      globeSizePx,
      positionYOffsets,
    };
    try {
      const previous = window.localStorage.getItem(SAVE_KEY);
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(config));
      if (previous != null) {
        window.localStorage.setItem(BACKUP_KEY, previous);
      }
      setHasBackup(previous != null);
      setSavedAt(Date.now());
      // Make this config the working lobby in VX2 (and future VX) so the app uses it in the phone-frame lobby.
      saveWorkingLobbyConfig({
        outlineOn,
        outlineThickness,
        outlineInset,
        outlineRadius,
        globeSizePx,
        positionYOffsets: positionYOffsets ?? {},
        objectsInPhone,
      });
    } catch {
      // ignore
    }
  };

  const undoConfig = () => {
    const backup = loadBackupConfig();
    if (!backup) return;
    try {
      applyConfig(
        setStateOverride,
        setObjectsInPhone,
        setOutlineOn,
        setOutlineThickness,
        setOutlineInset,
        setOutlineRadius,
        setGlobeSizePx,
        setPositionYOffsets,
        backup
      );
      const raw = window.localStorage.getItem(BACKUP_KEY);
      if (raw != null) {
        window.localStorage.setItem(SAVE_KEY, raw);
      }
      setUndoneAt(Date.now());
    } catch {
      // ignore
    }
  };

  const resetToSpecDefaults = () => {
    setStateOverride('default');
    setObjectsInPhone({ ...defaultObjectsInPhone });
    setOutlineOn(SPEC.outline.enabled);
    setOutlineThickness(SPEC.outline.thickness_px);
    setOutlineInset(SPEC.outline.inset_px);
    setOutlineRadius(SPEC.outline.radius_px);
    setGlobeSizePx(SPEC.lobby.globe_size_px);
    setPositionYOffsets({ ...DEFAULT_POSITION_Y });
  };

  React.useEffect(() => {
    if (savedAt == null) return;
    const t = window.setTimeout(() => setSavedAt(null), 2000);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  React.useEffect(() => {
    if (copiedAt == null) return;
    const t = window.setTimeout(() => setCopiedAt(null), 2000);
    return () => window.clearTimeout(t);
  }, [copiedAt]);

  React.useEffect(() => {
    if (undoneAt == null) return;
    const t = window.setTimeout(() => setUndoneAt(null), 2000);
    return () => window.clearTimeout(t);
  }, [undoneAt]);

  const t = MOCK_TOURNAMENT;

  return (
    <>
      <Head>
        <title>Lobby Tab Sandbox - TopDog</title>
        <meta name="description" content="Testing environment for Lobby objects – add back into phone one at a time" />
      </Head>
      <AuthProvider>
      <div
        className="min-h-screen"
        style={{ backgroundColor: PAGE_BG, padding: '24px 16px' }}
      >
        {/* Three-column layout: Left controls | Phone | Right controls */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 24 }}>
          
          {/* LEFT PANEL: Dev controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280, flexShrink: 0 }}>
            
            {/* State Override + Save/Reset/Undo */}
            <div
              style={{
                padding: 14,
                backgroundColor: 'rgba(17, 24, 39, 0.98)',
                borderRadius: 10,
                border: '1px solid #374151',
              }}
            >
              <label
                style={{
                  color: '#F9FAFB',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                State Override
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {(['default', 'loading', 'error', 'empty'] as const).map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => setStateOverride(state)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: stateOverride === state ? 600 : 400,
                      backgroundColor: stateOverride === state ? '#3B82F6' : '#374151',
                      color: '#FFF',
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                    aria-pressed={stateOverride === state}
                  >
                    {state}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={saveConfig}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: '#10B981',
                    color: '#FFF',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  aria-label="Save configuration and set as working lobby in VX2"
                  title="Save and make this the working lobby in VX2 (and future VX) so the app uses it in the phone-frame lobby"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={resetToSpecDefaults}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: '#6B7280',
                    color: '#FFF',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  aria-label="Reset to spec defaults"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={undoConfig}
                  disabled={!hasBackup}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: hasBackup ? '#F59E0B' : '#4B5563',
                    color: '#FFF',
                    border: 'none',
                    cursor: hasBackup ? 'pointer' : 'not-allowed',
                    opacity: hasBackup ? 1 : 0.6,
                  }}
                  aria-label="Restore previous saved configuration"
                  title={hasBackup ? 'Restore config from last save (e.g. previous session)' : 'No previous save to restore'}
                >
                  Undo
                </button>
                {savedAt != null && (
                  <span style={{ color: '#10B981', fontSize: 12, fontWeight: 500 }}>Saved</span>
                )}
                {undoneAt != null && (
                  <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 500 }}>Restored</span>
                )}
              </div>
            </div>

            {/* Outline dev tool */}
            <div
              style={{
                padding: 14,
                backgroundColor: 'rgba(17, 24, 39, 0.98)',
                borderRadius: 10,
                border: '1px solid #374151',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 600 }}>Outline dev tool</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#E5E7EB', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={outlineOn}
                    onChange={(e) => setOutlineOn(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#3B82F6' }}
                    aria-label="Show outline"
                  />
                  Show
                </label>
              </div>
              <SliderRow
                label="Thickness"
                value={outlineThickness}
                min={2}
                max={24}
                onChange={setOutlineThickness}
              />
              <SliderRow
                label="Inset from edges"
                value={outlineInset}
                min={0}
                max={48}
                onChange={setOutlineInset}
              />
              <SliderRow
                label="Radius"
                value={outlineRadius}
                min={0}
                max={48}
                onChange={setOutlineRadius}
              />
            </div>

            {/* Image size (dev) */}
            <div
              style={{
                padding: 14,
                backgroundColor: 'rgba(17, 24, 39, 0.98)',
                borderRadius: 10,
                border: '1px solid #374151',
              }}
            >
              <span style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12 }}>Image size (dev)</span>
              <SliderRow
                label="Globe size"
                value={globeSizePx}
                min={80}
                max={400}
                step={4}
                onChange={setGlobeSizePx}
              />
            </div>

            {/* Position (dev) – height */}
            <div
              style={{
                padding: 14,
                backgroundColor: 'rgba(17, 24, 39, 0.98)',
                borderRadius: 10,
                border: '1px solid #374151',
              }}
            >
              <span style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Position (dev) – height
              </span>
              <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 12 }}>
                Y offset in px. Positive = down.
              </p>
              {POSITION_TARGETS.map((target) => (
                <div key={target} style={{ marginBottom: target === 'outline' ? 0 : 10 }}>
                  <SliderRow
                    label={`${POSITION_Y_LABELS[target]} Y`}
                    value={positionYOffsets[target]}
                    min={-120}
                    max={120}
                    step={2}
                    onChange={(n) => setPositionYOffsets((prev) => ({ ...prev, [target]: n }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: Phone */}
          <div style={{ flexShrink: 0 }}>
            <TabNavigationProvider initialTab="lobby">
              <MobilePhoneFrame>
                <InPhoneFrameProvider value={true}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: BG_COLORS.primary,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <SandboxPhoneBody>
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                      <LobbyTabSandboxContent
                        tournament={t}
                        onJoinClick={handleJoinClick}
                        outlineOverrides={{
                          on: outlineOn,
                          thickness: outlineThickness,
                          inset: outlineInset,
                          radius: outlineRadius,
                        }}
                        globeSizePx={globeSizePx}
                        objectsInPhone={objectsInPhone}
                        showEmptyPrompt
                        stateOverride={stateOverride}
                        data-outline-debug={outlineOn ? 'true' : undefined}
                        contentScaleOverride={1}
                        globeImageSrc={globeSrc}
                        scrollable={false}
                        positionOverrides={{
                          logoTitle: { y: positionYOffsets.logoTitle },
                          progressBar: { y: positionYOffsets.progressBar },
                          joinButton: { y: positionYOffsets.joinButton },
                          stats: { y: positionYOffsets.stats },
                          globe: { y: positionYOffsets.globe },
                          outline: { y: positionYOffsets.outline },
                        }}
                      />
                    </div>
                  </SandboxPhoneBody>
                  <TabBarVX2 />
                </div>
                </InPhoneFrameProvider>
              </MobilePhoneFrame>
            </TabNavigationProvider>
          </div>

          {/* RIGHT PANEL: Lobby objects + Dimensions spec */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 300, flexShrink: 0 }}>
            
            {/* Lobby objects */}
            <div
              style={{
                padding: 16,
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                borderRadius: 10,
                border: '1px solid #374151',
              }}
            >
              <h2
                style={{
                  color: '#F9FAFB',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Lobby objects
              </h2>
              <p
                style={{
                  color: '#9CA3AF',
                  fontSize: 11,
                  marginBottom: 14,
                }}
              >
                Toggle to add each object into the phone.
              </p>

              <ObjectToggle
                id="logoTitle"
                label={OBJECT_LABELS.logoTitle}
                checked={objectsInPhone.logoTitle}
                onToggle={toggleInPhone}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <TournamentCardLogo src={LOGO_IMAGE} alt="Logo" maxHeight={40} />
                  <TournamentTitle title={t.title} fontSize={18} />
                </div>
              </ObjectToggle>

              <ObjectToggle
                id="progressBar"
                label={OBJECT_LABELS.progressBar}
                checked={objectsInPhone.progressBar}
                onToggle={toggleInPhone}
              >
                <TournamentProgressBar currentEntries={t.currentEntries} maxEntries={t.maxEntries} />
              </ObjectToggle>

              <ObjectToggle
                id="joinButton"
                label={OBJECT_LABELS.joinButton}
                checked={objectsInPhone.joinButton}
                onToggle={toggleInPhone}
              >
                <TournamentJoinButton onClick={() => handleJoinClick(t.id)} label="Join Tournament" />
              </ObjectToggle>

              <ObjectToggle
                id="stats"
                label={OBJECT_LABELS.stats}
                checked={objectsInPhone.stats}
                onToggle={toggleInPhone}
              >
                <TournamentStats entryFee={t.entryFee} entries={t.totalEntries} prize={t.firstPlacePrize} />
              </ObjectToggle>

              <ObjectToggle
                id="globe"
                label={OBJECT_LABELS.globe}
                checked={objectsInPhone.globe}
                onToggle={toggleInPhone}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 80,
                  }}
                >
                  <Image
                    src={globeSrc}
                    alt="Globe (no background)"
                    width={80}
                    height={80}
                    style={{ objectFit: 'contain', display: 'block' }}
                    onError={() => setGlobeSrc(GLOBE_IMAGE_FALLBACK)}
                  />
                </div>
              </ObjectToggle>
            </div>

            {/* Dimensions spec */}
            <div
              style={{
                padding: 14,
                backgroundColor: 'rgba(17, 24, 39, 0.98)',
                borderRadius: 10,
                border: '1px solid #374151',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 600 }}>
                  Dimensions spec
                </span>
                <button
                  type="button"
                  onClick={copyDimensionsSpec}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    padding: 0,
                    border: 'none',
                    borderRadius: 6,
                    backgroundColor: copiedAt ? '#10B981' : '#374151',
                    color: copiedAt ? '#FFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  aria-label={copiedAt ? 'Copied' : 'Copy dimensions spec'}
                  title="Copy for agent handoff"
                >
                  <CopyIcon size={18} />
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 10,
                  fontSize: 10,
                  fontFamily: 'ui-monospace, monospace',
                  color: '#E5E7EB',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  borderRadius: 8,
                  overflow: 'auto',
                  maxHeight: 180,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  border: '1px solid #374151',
                }}
              >
                {dimensionsSpec}
              </pre>
            </div>
          </div>
        </div>
      </div>
      {joinModalTournament && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          <JoinTournamentModal
            tournament={joinModalTournament}
            onClose={handleCloseJoinModal}
            onConfirm={handleConfirmJoin}
            isJoining={isJoining}
          />
        </div>
      )}
      </AuthProvider>
    </>
  );
}
