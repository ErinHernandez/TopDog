/**
 * DraftsTabVX2 - Unified Drafts Tab with Fast/Slow Switch
 *
 * This component serves as the main entry point for the drafts tab,
 * switching between FastDraftsTabVX2 and SlowDraftsTabVX2 based on
 * user selection.
 *
 * Fast Drafts: 30-second pick timer, quick in-and-out experience
 * Slow Drafts: Hours/days per pick, rich mini-dashboard experience
 */

import React, { useState, useCallback } from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import type { LiveDraft } from '../../hooks/data';
import type { SlowDraft } from '../slow-drafts/types';

// Import both tab implementations
import LiveDraftsTabVX2 from './LiveDraftsTabVX2';
import SlowDraftsTabVX2 from '../slow-drafts/SlowDraftsTabVX2';

// ============================================================================
// TYPES
// ============================================================================

type DraftMode = 'fast' | 'slow';

export interface DraftsTabVX2Props {
  /** Callback when user enters a fast draft */
  onEnterFastDraft?: (draft: LiveDraft) => void;
  /** Callback when user enters a slow draft */
  onEnterSlowDraft?: (draft: SlowDraft) => void;
  /** Callback when user wants to join a new draft */
  onJoinDraft?: () => void;
  /** Callback for quick pick in slow drafts */
  onQuickPick?: (draftId: string, playerId: string) => Promise<void>;
  /** Initial mode */
  initialMode?: DraftMode;
}

// ============================================================================
// TAB SWITCHER
// ============================================================================

interface TabSwitcherProps {
  selected: DraftMode;
  onSelect: (mode: DraftMode) => void;
}

function TabSwitcher({ selected, onSelect }: TabSwitcherProps): React.ReactElement {
  console.log('[DraftsTabVX2] TabSwitcher rendering, selected:', selected);
  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: '3px',
        gap: '3px',
      }}
    >
      <button
        onClick={() => {
          console.log('[DraftsTabVX2] Fast button clicked');
          onSelect('fast');
        }}
        className="flex-1 py-2.5 px-3 font-semibold transition-all"
        style={{
          fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
          backgroundColor: selected === 'fast' ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: selected === 'fast' ? TEXT_COLORS.primary : TEXT_COLORS.muted,
          borderRadius: `${RADIUS.md}px`,
          letterSpacing: '-0.01em',
        }}
      >
        Fast Drafts (30 Sec)
      </button>
      <button
        onClick={() => {
          console.log('[DraftsTabVX2] Slow button clicked');
          onSelect('slow');
        }}
        className="flex-1 py-2.5 px-3 font-semibold transition-all"
        style={{
          fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
          backgroundColor: selected === 'slow' ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: selected === 'slow' ? TEXT_COLORS.primary : TEXT_COLORS.muted,
          borderRadius: `${RADIUS.md}px`,
          letterSpacing: '-0.01em',
        }}
      >
        Slow Drafts
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftsTabVX2({
  onEnterFastDraft,
  onEnterSlowDraft,
  onJoinDraft,
  onQuickPick,
  initialMode = 'fast',
}: DraftsTabVX2Props): React.ReactElement {
  const [mode, setMode] = useState<DraftMode>(initialMode);

  // Debug logging - Force HMR
  console.log('[DraftsTabVX2] Rendering with mode:', mode, '(v2)');

  // Handler for entering a draft (bridges the type difference)
  const handleEnterFastDraft = useCallback(
    (draft: LiveDraft) => {
      onEnterFastDraft?.(draft);
    },
    [onEnterFastDraft]
  );

  const handleEnterSlowDraft = useCallback(
    (draft: SlowDraft) => {
      onEnterSlowDraft?.(draft);
    },
    [onEnterSlowDraft]
  );

  return (
    <div
      className="flex-1 flex flex-col"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Tab Switcher Header */}
      <div
        className="flex-shrink-0"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: BG_COLORS.primary,
          paddingLeft: SPACING.lg,
          paddingRight: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: SPACING.md,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <TabSwitcher selected={mode} onSelect={setMode} />
      </div>

      {/* Content based on mode */}
      {mode === 'fast' ? (
        <LiveDraftsTabVX2
          onEnterDraft={handleEnterFastDraft}
          onJoinDraft={onJoinDraft}
          hideTabSwitcher={true}
        />
      ) : (
        <SlowDraftsTabVX2
          onEnterDraft={handleEnterSlowDraft}
          onJoinDraft={onJoinDraft}
          onQuickPick={onQuickPick}
        />
      )}
    </div>
  );
}
