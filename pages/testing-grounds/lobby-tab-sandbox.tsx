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

import React, { useState } from 'react';
import Head from 'next/head';
import { TabNavigationProvider } from '../../components/vx2/core';
import { TabBarVX2 } from '../../components/vx2/navigation';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { BG_COLORS } from '../../components/vx2/core/constants';
import { CARD_SPACING_V3 } from '../../components/vx2/tabs/lobby/constants/cardSpacingV3';
import {
  TournamentCardLogo,
  TournamentTitle,
  TournamentProgressBar,
  TournamentJoinButton,
  TournamentStats,
} from '../../components/vx2/tabs/lobby/elements';
import type { Tournament } from '../../components/vx2/hooks/data';

const PAGE_BG = '#1a1a2e';
const LOGO_IMAGE = '/tournament_card_background.png';

/** Outline dev tool: simple outline with four equal sides. */
const OUTLINE_DEFAULT_THICKNESS = 8;
const OUTLINE_DEFAULT_INSET = 8;
const OUTLINE_DEFAULT_RADIUS = 0;
const OUTLINE_COLOR = '#3B82F6';
/** Distance from top edge of phone to content top. */
const SAFE_AREA_TOP = 14;
/** Globe image. Set to '/_globe_nobackground.png' when that file is in public/. SVG can fail in <img>, so we default to a working asset. */
const GLOBE_IMAGE_PRIMARY = '/globe_tournament_III.svg';
/** Shown when primary fails or as default so an image is always visible */
const GLOBE_IMAGE_FALLBACK = '/!!_GLOBE_NOBACKGROUND.png';

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

type LobbyObjectId = 'logoTitle' | 'progressBar' | 'joinButton' | 'stats' | 'globe';

const OBJECT_LABELS: Record<LobbyObjectId, string> = {
  logoTitle: 'Logo + Title',
  progressBar: 'Progress bar',
  joinButton: 'Join button',
  stats: 'Stats',
  globe: 'Globe (no background)',
};

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
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}): React.ReactElement {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: '#E5E7EB', fontSize: 12 }}>{label}</span>
        <span style={{ color: '#9CA3AF', fontSize: 12, minWidth: 28, textAlign: 'right' }}>{value}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#3B82F6' }}
        aria-label={label}
      />
    </div>
  );
}

export default function LobbyTabSandboxPage(): React.ReactElement {
  const [stateOverride, setStateOverride] = useState<'default' | 'loading' | 'error' | 'empty'>('default');
  const [objectsInPhone, setObjectsInPhone] = useState<Record<LobbyObjectId, boolean>>({
    logoTitle: false,
    progressBar: false,
    joinButton: false,
    stats: false,
    globe: false,
  });
  const [globeSrc, setGlobeSrc] = useState<string>(GLOBE_IMAGE_FALLBACK);
  const [outlineOn, setOutlineOn] = useState(false);
  const [outlineThickness, setOutlineThickness] = useState(OUTLINE_DEFAULT_THICKNESS);
  const [outlineInset, setOutlineInset] = useState(OUTLINE_DEFAULT_INSET);
  const [outlineRadius, setOutlineRadius] = useState(OUTLINE_DEFAULT_RADIUS);
  const [globeSizePx, setGlobeSizePx] = useState(220);

  const toggleInPhone = (id: LobbyObjectId) => {
    setObjectsInPhone((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasAnyInPhone = Object.values(objectsInPhone).some(Boolean);
  const t = MOCK_TOURNAMENT;

  return (
    <>
      <Head>
        <title>Lobby Tab Sandbox - TopDog</title>
        <meta name="description" content="Testing environment for Lobby objects – add back into phone one at a time" />
      </Head>
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
          {/* Left: Device/state controls + phone (footer only by default) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                width: 200,
              }}
            >
              <div style={{ width: '100%' }}>
                <label
                  style={{
                    color: '#9CA3AF',
                    fontSize: 12,
                    display: 'block',
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  State Override
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
              </div>
            </div>

            {/* Outline dev tool – four equal sides around content above footer */}
            <div
              style={{
                width: 280,
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
              <p style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 12, lineHeight: 1.35 }}>
                Outline with four equal sides. Footer never altered.
              </p>
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
                max={24}
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

            {/* Image size (dev) – controls globe size in phone */}
            <div
              style={{
                width: 280,
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

            <TabNavigationProvider initialTab="lobby">
              <MobilePhoneFrame>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: BG_COLORS.primary,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    data-outline-debug={outlineOn ? 'true' : undefined}
                    style={{
                      flex: 1,
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      ...(outlineOn ? {
                        marginTop: SAFE_AREA_TOP + outlineInset,
                        marginLeft: outlineInset,
                        marginRight: outlineInset,
                        marginBottom: outlineInset,
                        border: `${outlineThickness}px solid ${OUTLINE_COLOR}`,
                        borderRadius: outlineRadius,
                        boxSizing: 'border-box',
                      } : {}),
                    }}
                  >
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      paddingTop: SAFE_AREA_TOP,
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
                      transform: 'scale(0.92)',
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
                    {stateOverride === 'loading' && (
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
                    )}
                    {stateOverride === 'error' && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <span style={{ color: '#EF4444', fontSize: 14 }}>Error state</span>
                      </div>
                    )}
                    {stateOverride === 'empty' && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                        <span style={{ color: '#9CA3AF', fontSize: 14 }}>Empty state</span>
                      </div>
                    )}
                    {stateOverride === 'default' && (
                      <>
                        {!hasAnyInPhone ? (
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
                        ) : (
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              padding: `${CARD_SPACING_V3.outerPadding}px`,
                              gap: `${CARD_SPACING_V3.bottomRowGap}px`,
                              minHeight: 0,
                            }}
                          >
                            {objectsInPhone.logoTitle && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <TournamentCardLogo src={LOGO_IMAGE} alt="Tournament logo" maxHeight={60} />
                                <div style={{ marginTop: 14, transform: 'translateY(-34px)' }}>
                                  <TournamentTitle title={t.title} fontSize={38} />
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
                                <img
                                  src={globeSrc}
                                  alt="Globe"
                                  width={globeSizePx}
                                  height={globeSizePx}
                                  style={{ width: globeSizePx, height: globeSizePx, objectFit: 'contain', display: 'block' }}
                                  onError={() => setGlobeSrc(GLOBE_IMAGE_FALLBACK)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  </div>
                  </div>
                  {stateOverride === 'default' && (objectsInPhone.progressBar || objectsInPhone.joinButton || objectsInPhone.stats) && (
                    <div
                      style={{
                        flexShrink: 0,
                        padding: `0 ${CARD_SPACING_V3.outerPadding}px ${CARD_SPACING_V3.outerPadding}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: CARD_SPACING_V3.bottomRowGap,
                      }}
                    >
                      {objectsInPhone.progressBar && (
                        <div style={{ transform: 'translateY(-14px)' }}>
                          <TournamentProgressBar currentEntries={t.currentEntries} maxEntries={t.maxEntries} />
                        </div>
                      )}
                      {objectsInPhone.joinButton && (
                        <div style={{ transform: 'translateY(-4px)' }}>
                          <TournamentJoinButton onClick={() => {}} label="Join Tournament" />
                        </div>
                      )}
                      {objectsInPhone.stats && (
                        <TournamentStats
                          entryFee={t.entryFee}
                          entries={t.totalEntries}
                          prize={t.firstPlacePrize}
                        />
                      )}
                    </div>
                  )}
                  </div>
                  <TabBarVX2 />
                </div>
              </MobilePhoneFrame>
            </TabNavigationProvider>
          </div>

          {/* Right: Lobby objects – each with "Show in phone" toggle */}
          <div
            style={{
              width: 320,
              maxWidth: '100%',
              padding: 20,
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              borderRadius: 12,
              border: '1px solid #374151',
            }}
          >
            <h2
              style={{
                color: '#F9FAFB',
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Lobby objects
            </h2>
            <p
              style={{
                color: '#9CA3AF',
                fontSize: 12,
                marginBottom: 20,
              }}
            >
              Toggle “Show in phone” to add each object back into the phone one at a time.
            </p>

            <ObjectToggle
              id="logoTitle"
              label={OBJECT_LABELS.logoTitle}
              checked={objectsInPhone.logoTitle}
              onToggle={toggleInPhone}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TournamentCardLogo src={LOGO_IMAGE} alt="Logo" maxHeight={48} />
                <TournamentTitle title={t.title} fontSize={28} />
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
              <TournamentJoinButton onClick={() => {}} label="Join Tournament" />
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
                  minHeight: 141,
                }}
              >
                <img
                  src={globeSrc}
                  alt="Globe (no background)"
                  width={141}
                  height={141}
                  style={{ width: 141, height: 141, objectFit: 'contain', display: 'block' }}
                  onError={() => setGlobeSrc(GLOBE_IMAGE_FALLBACK)}
                />
              </div>
            </ObjectToggle>
          </div>
        </div>
      </div>
    </>
  );
}
