/**
 * Slow Draft Sandbox - Test Page
 * 
 * A standalone page to test and develop SlowDraft components
 */

import React from 'react';
import SlowDraftsTabVX2 from './SlowDraftsTabVX2';
import { BG_COLORS } from './deps/core/constants/colors';
import type { SlowDraft } from './types';

export default function SlowDraftSandbox() {
  const handleEnterDraft = (draft: SlowDraft) => {
    console.log('Enter draft:', draft);
    alert(`Entering draft: ${draft.tournamentName}`);
  };

  const handleJoinDraft = () => {
    console.log('Join draft');
    alert('Join new slow draft');
  };

  const handleQuickPick = async (draftId: string, playerId: string) => {
    console.log('Quick pick:', { draftId, playerId });
    alert(`Quick picking player ${playerId} in draft ${draftId}`);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: BG_COLORS.primary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: BG_COLORS.secondary,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}
        >
          Slow Draft Sandbox
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '4px 0 0 0',
          }}
        >
          Test environment for SlowDraft components
        </p>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SlowDraftsTabVX2
          onEnterDraft={handleEnterDraft}
          onJoinDraft={handleJoinDraft}
          onQuickPick={handleQuickPick}
        />
      </div>
    </div>
  );
}
