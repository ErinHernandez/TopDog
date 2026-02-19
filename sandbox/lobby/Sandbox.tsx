/**
 * LobbySandbox – Reusable "Lobby in phone" wrapper
 *
 * TabNavigationProvider + MobilePhoneFrame + LobbyTabVX2 + TabBarVX2.
 * Use in testing-grounds pages or other sandboxes that need the lobby inside a phone.
 *
 * See: docs/LOBBY_TAB_SANDBOX_PLAN.md, LOBBY_TAB_SANDBOX_HANDOFF.md
 */

import React from 'react';

import { TabNavigationProvider } from '../../components/vx2/core';
import { BG_COLORS } from '../../components/vx2/core/constants';
import type { DevicePresetId } from '../../components/vx2/core/constants';
import { TabBarVX2 } from '../../components/vx2/navigation';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { LobbyTabVX2 } from '../../components/vx2/tabs/lobby';
import { InPhoneFrameProvider } from '../../lib/inPhoneFrameContext';

export interface LobbySandboxProps {
  /** Device to render. Defaults to iPhone 14 Pro Max */
  devicePreset?: DevicePresetId;
  /** Label shown below phone frame */
  label?: string;
  /** Callback when user clicks join on a tournament */
  onJoinClick?: (tournamentId: string) => void;
}

export default function LobbySandbox({
  devicePreset = 'iphone-14-pro-max',
  label = 'Lobby Sandbox',
  onJoinClick,
}: LobbySandboxProps): React.ReactElement {
  return (
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
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <LobbyTabVX2 onJoinClick={onJoinClick} />
            </div>
            <TabBarVX2 />
          </div>
        </InPhoneFrameProvider>
      </MobilePhoneFrame>
    </TabNavigationProvider>
  );
}
