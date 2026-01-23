/**
 * Lobby Tab Sandbox - Testing Grounds Page
 *
 * Isolated environment for the Lobby tab (LobbyTabVX2).
 * Renders the full lobby inside a phone frame with tab bar.
 * Phase 2: device selector dropdown. Phase 3: loading/error/empty state overrides.
 *
 * Access: /testing-grounds/lobby-tab-sandbox
 * See: docs/LOBBY_TAB_SANDBOX_PLAN.md, LOBBY_TAB_SANDBOX_HANDOFF.md
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { TabNavigationProvider } from '../../components/vx2/core';
import { TabBarVX2 } from '../../components/vx2/navigation';
import { LobbyTabVX2 } from '../../components/vx2/tabs/lobby';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { EmptyState, ErrorState } from '../../components/vx2/components/shared/feedback';
import { BG_COLORS, DEVICE_PRESETS, ALL_DEVICES } from '../../components/vx2/core/constants';
import type { DevicePresetId } from '../../components/vx2/core/constants';

const PAGE_BG = '#1a1a2e';
const DEFAULT_DEVICE: DevicePresetId = 'iphone-14-pro-max';

type StateOverride = 'default' | 'loading' | 'error' | 'empty';

function LoadingPlaceholder(): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        animation: 'pulse 2s infinite',
      }}
      role="status"
      aria-label="Loading tournaments"
    />
  );
}

function ErrorPlaceholder({ onRetry }: { onRetry: () => void }): React.ReactElement {
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
      <ErrorState
        title="Failed to load tournaments"
        description="Simulated error for sandbox"
        onRetry={onRetry}
      />
    </div>
  );
}

function EmptyPlaceholder({ onRefresh }: { onRefresh: () => void }): React.ReactElement {
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
      <EmptyState
        title="No Tournaments Available"
        description="Simulated empty state"
        action={{ label: 'Refresh', onClick: onRefresh, variant: 'secondary' }}
      />
    </div>
  );
}

export default function LobbyTabSandboxPage(): React.ReactElement {
  const [devicePreset, setDevicePreset] = useState<DevicePresetId>(DEFAULT_DEVICE);
  const [stateOverride, setStateOverride] = useState<StateOverride>('default');

  return (
    <>
      <Head>
        <title>Lobby Tab Sandbox - TopDog</title>
        <meta name="description" content="Testing environment for LobbyTabVX2" />
      </Head>

      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: PAGE_BG }}
      >
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
                htmlFor="device-select"
                style={{
                  color: '#9CA3AF',
                  fontSize: 12,
                  display: 'block',
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                Device Preview
              </label>
              <select
                id="device-select"
                value={devicePreset}
                onChange={(e) => setDevicePreset(e.target.value as DevicePresetId)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: 6,
                  color: '#FFF',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {ALL_DEVICES.map((id) => (
                  <option key={id} value={id}>
                    {DEVICE_PRESETS[id]?.name ?? id}
                  </option>
                ))}
              </select>
            </div>

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
                      transition: 'background-color 150ms ease',
                    }}
                    aria-pressed={stateOverride === state}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
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
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {stateOverride === 'loading' && <LoadingPlaceholder />}
                  {stateOverride === 'error' && (
                    <ErrorPlaceholder onRetry={() => setStateOverride('default')} />
                  )}
                  {stateOverride === 'empty' && (
                    <EmptyPlaceholder onRefresh={() => setStateOverride('default')} />
                  )}
                  {stateOverride === 'default' && (
                    <LobbyTabVX2 onJoinClick={(id) => console.log('Join clicked:', id)} />
                  )}
                </div>
                <TabBarVX2 />
              </div>
            </MobilePhoneFrame>
          </TabNavigationProvider>
        </div>
      </div>
    </>
  );
}
