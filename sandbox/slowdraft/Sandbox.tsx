/**
 * Slow Draft Sandbox - Test Page
 * 
 * A standalone page to test and develop SlowDraft components
 */

import React, { useCallback } from 'react';

import { BG_COLORS } from './deps/core/constants/colors';
import SlowDraftsTabVX2 from './SlowDraftsTabVX2';
import type { SlowDraft } from './types';

export default function SlowDraftSandbox(): React.ReactElement {
  const handleEnterDraft = useCallback((draft: SlowDraft): void => {
    console.info('Enter draft:', draft);
    alert(`Entering draft: ${draft.tournamentName}`);
  }, []);

  const handleJoinDraft = useCallback((): void => {
    console.info('Join draft');
    alert('Join new slow draft');
  }, []);

  const handleQuickPick = useCallback(
    async (draftId: string, playerId: string): Promise<void> => {
      try {
        console.info('Quick pick:', { draftId, playerId });
        alert(`Quick picking player ${playerId} in draft ${draftId}`);
      } catch (error) {
        console.error('Quick pick failed:', error);
        alert('Failed to quick pick player');
      }
    },
    []
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
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
          paddingTop: '44px', // Account for Dynamic Island (8px top + 20px height + 16px spacing)
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
