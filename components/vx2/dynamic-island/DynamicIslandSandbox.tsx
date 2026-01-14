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
// STYLES
// ============================================================================

// Add pulsing animation for background
if (typeof document !== 'undefined') {
  const styleId = 'dynamic-island-pulse-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulseBackground {
        0%, 100% {
          opacity: 1;
          background-size: 200px 200px;
        }
        50% {
          opacity: 0.7;
          background-size: 220px 220px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

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
                roomId={roomId}
                onNavigateToDraft={(id) => {
                  // Navigate to draft room
                  if (typeof window !== 'undefined') {
                    window.location.href = `/draft/topdog/${id}`;
                  }
                }}
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
    timerSeconds <= 5 ? 'critical' : 
    timerSeconds <= 10 ? 'warning' : 
    'normal';

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
    timerSeconds <= 5 ? 'critical' : 
    timerSeconds <= 10 ? 'warning' : 
    'normal';

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
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-center">
        <div className="text-xs text-gray-600">9:41 AM</div>
      </div>
    );
  }

  // Determine island size based on state and urgency
  const isExpanded = state === 'out-of-app-live' || content.urgency === 'critical';
  const islandWidth = isExpanded ? 'w-72' : 'w-32';
  const islandHeight = isExpanded ? 'h-16' : 'h-8';

  // Urgency colors and background
  const getUrgencyColor = () => {
    // In draft, user on the clock: use wr_blue.png background with red text
    if (content.isInDraft && content.isMyTurn) {
      return ''; // No background color class, use inline style with image
    }
    if (content.urgency === 'critical') return 'bg-red-500';
    if (content.urgency === 'warning') return 'bg-orange-500';
    return 'bg-black';
  };

  const getBackgroundStyle = () => {
    // In draft, user on the clock: use wr_blue.png background with pulse animation
    if (content.isInDraft && content.isMyTurn) {
      return {
        backgroundImage: 'url(/wr_blue.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        backgroundColor: '#1E3A5F', // Fallback color
        animation: 'pulseBackground 2s ease-in-out infinite',
      };
    }
    return {};
  };

  const getTextColor = () => {
    // Always use white text
    return 'text-white';
  };

  // Handle click to navigate to draft room
  const handleClick = () => {
    if (roomId && state === 'out-of-draft' && content.isMyTurn) {
      onNavigateToDraft?.(roomId);
    }
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
          ${getTextColor()} text-xs font-medium
          shadow-lg
          transition-all duration-300 ease-in-out
          ${state === 'out-of-draft' && content.isMyTurn ? 'cursor-pointer hover:opacity-90' : ''}
        `}
        style={getBackgroundStyle()}
        onClick={handleClick}
        role={state === 'out-of-draft' && content.isMyTurn ? 'button' : undefined}
        tabIndex={state === 'out-of-draft' && content.isMyTurn ? 0 : undefined}
        onKeyDown={(e) => {
          if (state === 'out-of-draft' && content.isMyTurn && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Compact view */}
        {!isExpanded && (
          <div className="flex items-center gap-2 px-3">
            {content.showTimer && (
              <span className="tabular-nums">{content.timerSeconds}</span>
            )}
            <span className="truncate max-w-[80px]">{content.compactText}</span>
          </div>
        )}

        {/* Expanded view */}
        {isExpanded && (
          <div className="flex flex-col items-center justify-center px-4 py-2 w-full">
            {content.showTimer && (
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="tabular-nums font-bold text-sm">{content.timerSeconds}</span>
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
