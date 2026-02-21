/**
 * Dynamic Island Sandbox - React Component
 *
 * Visualizes the three Dynamic Island states:
 * 1. In-draft state (user actively in draft room)
 * 2. Out-of-draft state (user in app but not in draft)
 * 3. Out-of-app-during-live-draft state (user left app but draft is live)
 *
 * This is a web-based visualization/simulation for development and demo purposes.
 * For actual Dynamic Island functionality, see the iOS Swift implementation.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { cn } from '@/lib/styles';

import { STATE_COLORS, BG_COLORS, UI_COLORS } from '../core/constants/colors';
import type { DraftStatus } from '../draft-room/types';

import styles from './DynamicIslandSandbox.module.css';

// ============================================================================
// TYPES
// ============================================================================

export type DynamicIslandState =
  | 'in-draft' // User is actively in the draft room
  | 'out-of-draft' // User is in app but not in a draft
  | 'out-of-app-live'; // User left app but draft is still live

export interface DynamicIslandSandboxProps {
  /** Current state to display */
  state?: DynamicIslandState;
  /** Draft status (if in draft) */
  draftStatus?: DraftStatus;
  /** Seconds remaining on timer (if active) */
  timerSeconds?: number;
  /** Total seconds for pick */
  totalSeconds?: number;
  /** Whether it's user's turn */
  isMyTurn?: boolean;
  /** Current pick number */
  currentPickNumber?: number;
  /** Total picks in draft */
  totalPicks?: number;
  /** Current drafter name */
  currentDrafter?: string;
  /** Room ID */
  roomId?: string;
  /** Autopick player name (if timer expires) */
  autopickPlayerName?: string;
  /** Auto-cycle through states for demo */
  autoCycle?: boolean;
  /** Cycle duration in seconds */
  cycleDuration?: number;
  /** Callback when state changes */
  onStateChange?: (state: DynamicIslandState) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMER = 30;
const DEFAULT_CYCLE_DURATION = 5;

// ============================================================================
// COMPONENT
// ============================================================================

export default function DynamicIslandSandbox({
  state: externalState,
  draftStatus = 'active',
  timerSeconds: externalTimerSeconds,
  totalSeconds = DEFAULT_TIMER,
  isMyTurn = false,
  currentPickNumber = 1,
  totalPicks = 216,
  currentDrafter = 'You',
  roomId = 'demo-room',
  autopickPlayerName,
  autoCycle = false,
  cycleDuration = DEFAULT_CYCLE_DURATION,
  onStateChange,
}: DynamicIslandSandboxProps): React.ReactElement {
  // Internal state management
  const [internalState, setInternalState] = useState<DynamicIslandState>('in-draft');
  const [timerSeconds, setTimerSeconds] = useState(externalTimerSeconds ?? totalSeconds);
  const [cycleIndex, setCycleIndex] = useState(0);

  // Use external state if provided, otherwise use internal
  const currentState = externalState ?? internalState;

  // Auto-cycle through states for demo
  useEffect(() => {
    if (!autoCycle || externalState !== undefined) return;

    const states: DynamicIslandState[] = ['in-draft', 'out-of-draft', 'out-of-app-live'];
    const interval = setInterval(() => {
      setCycleIndex(prev => {
        const next = (prev + 1) % states.length;
        const newState = states[next]!;
        setInternalState(newState);
        onStateChange?.(newState);
        return next;
      });
    }, cycleDuration * 1000);

    return () => clearInterval(interval);
  }, [autoCycle, externalState, cycleDuration, onStateChange]);

  // Timer countdown for in-draft state
  useEffect(() => {
    if (
      currentState !== 'in-draft' ||
      draftStatus !== 'active' ||
      externalTimerSeconds !== undefined
    ) {
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 0) {
          return totalSeconds; // Reset when expired
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentState, draftStatus, externalTimerSeconds, totalSeconds]);

  // Update timer when external timer changes
  useEffect(() => {
    if (externalTimerSeconds !== undefined) {
      setTimerSeconds(externalTimerSeconds);
    }
  }, [externalTimerSeconds]);

  // Get Dynamic Island content based on state
  const islandContent = useMemo(() => {
    switch (currentState) {
      case 'in-draft':
        // Swapped: Use out-of-app-live content for in-draft
        return getOutOfAppLiveContent({
          timerSeconds: externalTimerSeconds ?? timerSeconds,
          totalSeconds,
          isMyTurn,
          currentPickNumber,
          totalPicks,
          currentDrafter,
          roomId,
          autopickPlayerName,
        });

      case 'out-of-draft':
        // Show Dynamic Island if user is on the clock even when out of draft
        if (isMyTurn && draftStatus === 'active') {
          return getInDraftContent({
            timerSeconds: externalTimerSeconds ?? timerSeconds,
            totalSeconds,
            isMyTurn: true,
            currentPickNumber,
            totalPicks,
            currentDrafter: 'You',
            draftStatus,
            autopickPlayerName,
          });
        }
        return getOutOfDraftContent();

      case 'out-of-app-live':
        // Swapped: Use in-draft content for out-of-app-live
        return getInDraftContent({
          timerSeconds: externalTimerSeconds ?? timerSeconds,
          totalSeconds,
          isMyTurn,
          currentPickNumber,
          totalPicks,
          currentDrafter,
          draftStatus,
          autopickPlayerName,
        });

      default:
        return null;
    }
  }, [
    currentState,
    externalTimerSeconds,
    timerSeconds,
    totalSeconds,
    isMyTurn,
    currentPickNumber,
    totalPicks,
    currentDrafter,
    draftStatus,
    roomId,
    autopickPlayerName,
  ]);

  // Manual state controls
  const handleStateChange = useCallback(
    (newState: DynamicIslandState) => {
      if (externalState === undefined) {
        setInternalState(newState);
      }
      onStateChange?.(newState);
    },
    [externalState, onStateChange],
  );

  return (
    <div className={styles.container}>
      {/* State selector */}
      <div className={styles.stateSelector}>
        {(['in-draft', 'out-of-draft', 'out-of-app-live'] as const).map(s => (
          <button
            key={s}
            onClick={() => handleStateChange(s)}
            className={cn(
              styles.stateButton,
              currentState === s
                ? undefined // Styles will be applied via CSS variables
                : undefined,
            )}
            data-active={currentState === s}
          >
            {s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Dynamic Island visualization */}
      <div className={styles.visualizationWrapper}>
        {/* iPhone frame (optional, for visual context) */}
        <div className={styles.iphoneFrame}>
          <div className={styles.iphoneScreen}>
            {/* Status bar / Dynamic Island area */}
            <div className={styles.statusBar}>
              {/* Dynamic Island */}
              <DynamicIslandVisualization
                state={currentState}
                content={islandContent}
                roomId={roomId}
                onNavigateToDraft={id => {
                  // Navigate to draft room
                  if (typeof window !== 'undefined') {
                    window.location.href = `/draft/topdog/${id}`;
                  }
                }}
              />
            </div>

            {/* App content area */}
            <div className={styles.appContent}>
              <div className={styles.appContentBox}>
                <div className={styles.appContentText}>
                  {currentState === 'in-draft' && (
                    <div>
                      <div className={styles.appContentTitle}>Draft Room</div>
                      <div className={styles.appContentSubtitle}>
                        Pick #{currentPickNumber} / {totalPicks}
                      </div>
                    </div>
                  )}
                  {currentState === 'out-of-draft' && (
                    <div>
                      <div className={styles.appContentTitle}>App Home</div>
                      <div className={styles.appContentSubtitle}>No active drafts</div>
                    </div>
                  )}
                  {currentState === 'out-of-app-live' && (
                    <div>
                      <div className={styles.appContentTitle}>Other App</div>
                      <div className={styles.appContentSubtitle}>
                        Draft continuing in background
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* State info */}
      <div className={styles.stateInfo}>
        <h3 className={styles.stateInfoTitle}>Current State: {currentState.replace(/-/g, ' ')}</h3>
        <div className={styles.stateInfoContent}>
          {islandContent && (
            <div className={styles.stateInfoItem}>
              <div className={styles.stateInfoLabel}>Dynamic Island Display:</div>
              <div className={styles.stateInfoValue}>{islandContent.description}</div>
            </div>
          )}
          {currentState === 'in-draft' && (
            <>
              <div className={styles.stateInfoItem}>
                Timer: {externalTimerSeconds ?? timerSeconds}s / {totalSeconds}s
              </div>
              <div className={styles.stateInfoItem}>
                Pick: {currentPickNumber} / {totalPicks}
              </div>
              <div className={styles.stateInfoItem}>Your Turn: {isMyTurn ? 'Yes' : 'No'}</div>
              <div className={styles.stateInfoItem}>Status: {draftStatus}</div>
            </>
          )}
          {currentState === 'out-of-app-live' && (
            <>
              <div className={styles.stateInfoItem}>Room ID: {roomId}</div>
              <div className={styles.stateInfoItem}>
                Timer: {externalTimerSeconds ?? timerSeconds}s
              </div>
              <div className={styles.stateInfoItem}>
                Pick: {currentPickNumber} / {totalPicks}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface IslandContent {
  description: string;
  compactText: string;
  expandedText?: string;
  showTimer?: boolean;
  timerSeconds?: number;
  totalSeconds?: number;
  urgency?: 'normal' | 'warning' | 'critical';
  isMyTurn?: boolean;
  isInDraft?: boolean;
}

function getInDraftContent({
  timerSeconds,
  totalSeconds,
  isMyTurn,
  currentPickNumber,
  totalPicks,
  currentDrafter,
  draftStatus,
  autopickPlayerName,
}: {
  timerSeconds: number;
  totalSeconds: number;
  isMyTurn: boolean;
  currentPickNumber: number;
  totalPicks: number;
  currentDrafter: string;
  draftStatus: DraftStatus;
  autopickPlayerName?: string;
}): IslandContent {
  if (draftStatus === 'paused') {
    return {
      description: 'Paused indicator in Dynamic Island',
      compactText: 'Draft Paused',
      expandedText: 'Draft paused',
    };
  }

  const urgency: 'normal' | 'warning' | 'critical' =
    timerSeconds <= 5 ? 'critical' : timerSeconds <= 10 ? 'warning' : 'normal';

  if (isMyTurn) {
    const expandedText = autopickPlayerName
      ? `Autopick would be: ${autopickPlayerName}`
      : 'Your pick!';

    return {
      description: 'Your turn timer countdown in Dynamic Island',
      compactText: 'Your Turn',
      expandedText,
      showTimer: true,
      timerSeconds,
      totalSeconds,
      urgency,
      isMyTurn: true,
      isInDraft: true,
    };
  }

  return {
    description: 'Other player picking indicator',
    compactText: `${currentDrafter} picking...`,
    expandedText: `${currentDrafter} is picking`,
    showTimer: true,
    timerSeconds,
    totalSeconds,
    urgency: 'normal',
    isMyTurn: false,
    isInDraft: true,
  };
}

function getOutOfDraftContent(): IslandContent {
  return {
    description: 'No Dynamic Island display (no active draft)',
    compactText: '',
    expandedText: undefined,
  };
}

function getOutOfAppLiveContent({
  timerSeconds,
  totalSeconds,
  isMyTurn,
  currentPickNumber,
  totalPicks,
  currentDrafter,
  roomId,
  autopickPlayerName,
}: {
  timerSeconds: number;
  totalSeconds: number;
  isMyTurn: boolean;
  currentPickNumber: number;
  totalPicks: number;
  currentDrafter: string;
  roomId: string;
  autopickPlayerName?: string;
}): IslandContent {
  const urgency: 'normal' | 'warning' | 'critical' =
    timerSeconds <= 5 ? 'critical' : timerSeconds <= 10 ? 'warning' : 'normal';

  if (isMyTurn) {
    const expandedText = autopickPlayerName
      ? `Autopick would be: ${autopickPlayerName}`
      : 'Your pick!';

    return {
      description: 'Live Activity showing your turn timer (while app is in background)',
      compactText: 'Your Turn',
      expandedText,
      showTimer: true,
      timerSeconds,
      totalSeconds,
      urgency,
      isMyTurn: true,
      isInDraft: false, // This is now used for "in-draft" state (swapped)
    };
  }

  return {
    description: 'Live Activity showing draft progress (while app is in background)',
    compactText: `${currentDrafter} picking...`,
    expandedText: `${currentDrafter} is picking`,
    showTimer: true,
    timerSeconds,
    totalSeconds,
    urgency: 'normal',
    isMyTurn: false,
    isInDraft: false, // This is now used for "in-draft" state (swapped)
  };
}

// ============================================================================
// DYNAMIC ISLAND VISUALIZATION
// ============================================================================

interface DynamicIslandVisualizationProps {
  state: DynamicIslandState;
  content: IslandContent | null;
  roomId?: string;
  onNavigateToDraft?: (roomId: string) => void;
}

function DynamicIslandVisualization({
  state,
  content,
  roomId,
  onNavigateToDraft,
}: DynamicIslandVisualizationProps): React.ReactElement {
  // If out-of-draft and no content, show nothing (normal status bar)
  // But if content exists (user on clock), show Dynamic Island
  if (!content || !content.compactText) {
    return (
      <div className={styles.emptyStatusBar}>
        <div className={styles.emptyStatusBarTime}>9:41 AM</div>
      </div>
    );
  }

  // Determine island size based on state and urgency
  const isExpanded = state === 'out-of-app-live' || content.urgency === 'critical';
  const islandWidth = isExpanded ? '18rem' : '8rem';
  const islandHeight = isExpanded ? '4rem' : '2rem';

  // Urgency colors and background
  const getUrgencyClass = () => {
    // In draft, user on the clock: use wr_blue.png background with red text
    if (content.isInDraft && content.isMyTurn) {
      return '';
    }
    if (content.urgency === 'critical') return styles.islandCritical;
    if (content.urgency === 'warning') return styles.islandWarning;
    return styles.islandNormal;
  };

  const getBackgroundStyle = () => {
    // In draft, user on the clock: use wr_blue.png background with pulse animation
    if (content.isInDraft && content.isMyTurn) {
      return {
        '--island-bg-image': 'url(/wr_blue.png)',
        '--island-bg-color': UI_COLORS.tiledBg,
      } as React.CSSProperties;
    }
    const bgColor =
      content.urgency === 'critical'
        ? STATE_COLORS.error
        : content.urgency === 'warning'
          ? STATE_COLORS.warning
          : BG_COLORS.black;
    return {
      '--island-bg-color': bgColor,
    } as React.CSSProperties;
  };

  // Handle click to navigate to draft room
  const handleClick = () => {
    if (roomId && state === 'out-of-draft' && content.isMyTurn) {
      onNavigateToDraft?.(roomId);
    }
  };

  const timerProgress =
    content.totalSeconds && content.timerSeconds
      ? (content.timerSeconds / content.totalSeconds) * 100
      : 0;

  return (
    <div className={styles.islandContainer}>
      {/* Dynamic Island pill */}
      <div
        className={cn(
          styles.islandPill,
          getUrgencyClass(),
          content.isInDraft && content.isMyTurn ? styles.islandPillWithBackgroundImage : '',
          state === 'out-of-draft' && content.isMyTurn ? styles.islandClickable : '',
        )}
        style={
          {
            ...getBackgroundStyle(),
            '--island-width': islandWidth,
            '--island-height': islandHeight,
            '--timer-progress-percent': `${Math.min(100, timerProgress)}%`,
          } as React.CSSProperties
        }
        onClick={handleClick}
        role={state === 'out-of-draft' && content.isMyTurn ? 'button' : undefined}
        tabIndex={state === 'out-of-draft' && content.isMyTurn ? 0 : undefined}
        onKeyDown={e => {
          if (
            state === 'out-of-draft' &&
            content.isMyTurn &&
            (e.key === 'Enter' || e.key === ' ')
          ) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Compact view */}
        {!isExpanded && (
          <div className={styles.compactView}>
            {content.showTimer && (
              <span className={styles.timerDisplay}>{content.timerSeconds}</span>
            )}
            <span className={styles.compactText}>{content.compactText}</span>
          </div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <div className={styles.expandedView}>
            {content.showTimer && content.timerSeconds !== undefined && (
              <div className={styles.timerBar}>
                <span className={styles.timerBarSeconds}>{content.timerSeconds}</span>
                {content.totalSeconds && (
                  <div className={styles.timerBarContainer}>
                    <div className={styles.timerBarFill} />
                  </div>
                )}
              </div>
            )}
            <div className={styles.expandedText}>{content.expandedText || content.compactText}</div>
          </div>
        )}
      </div>
    </div>
  );
}
