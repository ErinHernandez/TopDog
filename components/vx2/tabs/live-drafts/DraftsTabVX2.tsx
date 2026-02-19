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

import { cn } from '@/lib/styles';

import type { LiveDraft } from '../../hooks/data';
import SlowDraftsTabVX2 from '../slow-drafts/SlowDraftsTabVX2';
import type { SlowDraft } from '../slow-drafts/types';
import styles from './DraftsTabVX2.module.css';

// Import both tab implementations
import LiveDraftsTabVX2 from './LiveDraftsTabVX2';


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
  return (
    <div className={styles.tabSwitcher}>
      <button
        onClick={() => onSelect('fast')}
        className={cn(styles.tabButton)}
        data-active={selected === 'fast'}
      >
        Fast Drafts (30 Sec)
      </button>
      <button
        onClick={() => onSelect('slow')}
        className={cn(styles.tabButton)}
        data-active={selected === 'slow'}
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
      className={styles.container}
    >
      {/* Tab Switcher Header */}
      <div
        className={styles.header}
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
