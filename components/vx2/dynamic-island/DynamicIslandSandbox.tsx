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
import type { DraftStatus } from '../draft-room/types';

// ============================================================================
// TYPES
// ============================================================================

export type DynamicIslandState = 
  | 'in-draft'           // User is actively in the draft room
  | 'out-of-draft'       // User is in app but not in a draft
  | 'out-of-app-live';   // User left app but draft is still live

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
      setCycleIndex((prev) => {
        const next = (prev + 1) % states.length;
        const newState = states[next];
        setInternalState(newState);
        onStateChange?.(newState);
        return next;
      });
    }, cycleDuration * 1000);

    return () => clearInterval(interval);
  }, [autoCycle, externalState, cycleDuration, onStateChange]);

  // Timer countdown for in-draft state
  useEffect(() => {
    if (currentState !== 'in-draft' || draftStatus !== 'active' || externalTimerSeconds !== undefined) {
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
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
        return getInDraftContent({
          timerSeconds: externalTimerSeconds ?? timerSeconds,
          totalSeconds,
          isMyTurn,
          currentPickNumber,
          totalPicks,
          currentDrafter,
          draftStatus,
        });

      case 'out-of-draft':
        return getOutOfDraftContent();

      case 'out-of-app-live':
        return getOutOfAppLiveContent({
          timerSeconds: externalTimerSeconds ?? timerSeconds,
          totalSeconds,
          isMyTurn,
          currentPickNumber,
          totalPicks,
          currentDrafter,
          roomId,
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
  ]);

  // Manual state controls
  const handleStateChange = useCallback((newState: DynamicIslandState) => {
    if (externalState === undefined) {
      setInternalState(newState);
    }
    onStateChange?.(newState);
  }, [externalState, onStateChange]);

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      {/* State selector */}
      <div className="flex gap-4">
        {(['in-draft', 'out-of-draft', 'out-of-app-live'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleStateChange(s)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentState === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {s.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Dynamic Island visualization */}
      <div className="relative w-full max-w-md">
        {/* iPhone frame (optional, for visual context) */}
        <div className="mx-auto bg-black rounded-[3rem] p-2 shadow-2xl">
          <div className="bg-white rounded-[2.5rem] overflow-hidden">
            {/* Status bar / Dynamic Island area */}
            <div className="relative h-14 bg-gradient-to-b from-gray-100 to-white">
              {/* Dynamic Island */}
              <DynamicIslandVisualization
                state={currentState}
                content={islandContent}
              />
            </div>

            {/* App content area */}
            <div className="h-96 bg-white p-4">
              <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  {currentState === 'in-draft' && (
                    <div>
                      <div className="text-2xl font-bold mb-2">Draft Room</div>
                      <div className="text-sm">Pick #{currentPickNumber} / {totalPicks}</div>
                    </div>
                  )}
                  {currentState === 'out-of-draft' && (
                    <div>
                      <div className="text-2xl font-bold mb-2">App Home</div>
                      <div className="text-sm">No active drafts</div>
                    </div>
                  )}
                  {currentState === 'out-of-app-live' && (
                    <div>
                      <div className="text-2xl font-bold mb-2">Other App</div>
                      <div className="text-sm">Draft continuing in background</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* State info */}
      <div className="w-full max-w-md bg-gray-50 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4">Current State: {currentState.replace(/-/g, ' ')}</h3>
        <div className="space-y-2 text-sm text-gray-700">
          {islandContent && (
            <div>
              <div className="font-medium mb-1">Dynamic Island Display:</div>
              <div className="pl-4">{islandContent.description}</div>
            </div>
          )}
          {currentState === 'in-draft' && (
            <>
              <div>Timer: {externalTimerSeconds ?? timerSeconds}s / {totalSeconds}s</div>
              <div>Pick: {currentPickNumber} / {totalPicks}</div>
              <div>Your Turn: {isMyTurn ? 'Yes' : 'No'}</div>
              <div>Status: {draftStatus}</div>
            </>
          )}
          {currentState === 'out-of-app-live' && (
            <>
              <div>Room ID: {roomId}</div>
              <div>Timer: {externalTimerSeconds ?? timerSeconds}s</div>
              <div>Pick: {currentPickNumber} / {totalPicks}</div>
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
}

function getInDraftContent({
  timerSeconds,
  totalSeconds,
  isMyTurn,
  currentPickNumber,
  totalPicks,
  currentDrafter,
  draftStatus,
}: {
  timerSeconds: number;
  totalSeconds: number;
  isMyTurn: boolean;
  currentPickNumber: number;
  totalPicks: number;
  currentDrafter: string;
  draftStatus: DraftStatus;
}): IslandContent {
  if (draftStatus === 'paused') {
    return {
      description: 'Paused indicator in Dynamic Island',
      compactText: '⏸ Draft Paused',
      expandedText: `Draft paused - Pick ${currentPickNumber}/${totalPicks}`,
    };
  }

  const urgency: 'normal' | 'warning' | 'critical' = 
    timerSeconds <= 5 ? 'critical' : 
    timerSeconds <= 10 ? 'warning' : 
    'normal';

  if (isMyTurn) {
    return {
      description: 'Your turn timer countdown in Dynamic Island',
      compactText: `⏱ ${timerSeconds}s`,
      expandedText: `Your pick! ${timerSeconds}s remaining`,
      showTimer: true,
      timerSeconds,
      totalSeconds,
      urgency,
    };
  }

  return {
    description: 'Other player picking indicator',
    compactText: `${currentDrafter} picking...`,
    expandedText: `${currentDrafter} is picking - Pick ${currentPickNumber}/${totalPicks}`,
    showTimer: true,
    timerSeconds,
    totalSeconds,
    urgency: 'normal',
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
}: {
  timerSeconds: number;
  totalSeconds: number;
  isMyTurn: boolean;
  currentPickNumber: number;
  totalPicks: number;
  currentDrafter: string;
  roomId: string;
}): IslandContent {
  const urgency: 'normal' | 'warning' | 'critical' = 
    timerSeconds <= 5 ? 'critical' : 
    timerSeconds <= 10 ? 'warning' : 
    'normal';

  if (isMyTurn) {
    return {
      description: 'Live Activity showing your turn timer (while app is in background)',
      compactText: `📱 Your Turn! ${timerSeconds}s`,
      expandedText: `Your pick! ${timerSeconds}s remaining - Pick ${currentPickNumber}/${totalPicks}`,
      showTimer: true,
      timerSeconds,
      totalSeconds,
      urgency,
    };
  }

  return {
    description: 'Live Activity showing draft progress (while app is in background)',
    compactText: `📱 ${currentDrafter} picking...`,
    expandedText: `${currentDrafter} is picking - Pick ${currentPickNumber}/${totalPicks} - ${timerSeconds}s`,
    showTimer: true,
    timerSeconds,
    totalSeconds,
    urgency: 'normal',
  };
}

// ============================================================================
// DYNAMIC ISLAND VISUALIZATION
// ============================================================================

interface DynamicIslandVisualizationProps {
  state: DynamicIslandState;
  content: IslandContent | null;
}

function DynamicIslandVisualization({
  state,
  content,
}: DynamicIslandVisualizationProps): React.ReactElement {
  // If out-of-draft, show nothing (normal status bar)
  if (state === 'out-of-draft' || !content || !content.compactText) {
    return (
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-center">
        <div className="text-xs text-gray-600">9:41 AM</div>
      </div>
    );
  }

  // Determine island size based on state and urgency
  const isExpanded = state === 'out-of-app-live' || content.urgency === 'critical';
  const islandWidth = isExpanded ? 'w-72' : 'w-32';
  const islandHeight = isExpanded ? 'h-16' : 'h-8';

  // Urgency colors
  const getUrgencyColor = () => {
    if (content.urgency === 'critical') return 'bg-red-500';
    if (content.urgency === 'warning') return 'bg-orange-500';
    return 'bg-black';
  };

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2">
      {/* Dynamic Island pill */}
      <div
        className={`
          ${islandWidth} ${islandHeight}
          ${getUrgencyColor()}
          rounded-full
          flex items-center justify-center
          text-white text-xs font-medium
          shadow-lg
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Compact view */}
        {!isExpanded && (
          <div className="flex items-center gap-2 px-3">
            {content.showTimer && (
              <span className="tabular-nums">{content.timerSeconds}s</span>
            )}
            <span className="truncate max-w-[80px]">{content.compactText}</span>
          </div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <div className="flex flex-col items-center justify-center px-4 py-2 w-full">
            {content.showTimer && (
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="tabular-nums font-bold text-sm">{content.timerSeconds}s</span>
                {content.totalSeconds && (
                  <div className="flex-1 mx-2 bg-white/20 rounded-full h-1.5">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (content.timerSeconds / content.totalSeconds) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="text-xs mt-0.5 truncate w-full text-center">
              {content.expandedText || content.compactText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
