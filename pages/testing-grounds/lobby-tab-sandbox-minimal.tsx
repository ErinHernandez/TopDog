/**
 * Lobby Tab Sandbox (Minimal) – Testing Grounds Page
 *
 * Uses LobbySandbox wrapper: lobby in phone, no device selector or state overrides.
 * Access: /testing-grounds/lobby-tab-sandbox-minimal
 *
 * Full sandbox with controls: /testing-grounds/lobby-tab-sandbox
 * See: docs/LOBBY_TAB_SANDBOX_PLAN.md, LOBBY_TAB_SANDBOX_HANDOFF.md
 */

import Head from 'next/head';
import React from 'react';

import { LobbySandbox } from '../../sandbox/lobby';

const PAGE_BG = '#1a1a2e';

export default function LobbyTabSandboxMinimalPage(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Lobby Sandbox (Minimal) - TopDog</title>
        <meta name="description" content="Minimal LobbyTabVX2 sandbox – lobby in phone only" />
      </Head>
      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: PAGE_BG }}
      >
        <LobbySandbox onJoinClick={() => {}} />
      </div>
    </>
  );
}
