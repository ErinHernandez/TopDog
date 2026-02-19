/**
 * INTEGRATION_EXAMPLE.tsx
 *
 * Real-world example showing how to use all three shared hooks together
 * in a complete draft room implementation.
 *
 * This demonstrates:
 * 1. State machine for lifecycle management
 * 2. Real-time Firestore subscriptions
 * 3. Stable callbacks for handlers
 * 4. Proper error handling and recovery
 * 5. Analytics integration
 */

import { collection, doc, limit, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';
import { db } from '@/lib/firebase';

// Import shared hooks
import {
  useDraftStateMachine,
  useStableCallback,
  useFirestoreSubscription,
} from './index';
import type {
  DraftStateType,
  UseDraftStateMachineResult,
  UseFirestoreSubscriptionResult,
} from './index';

const logger = createScopedLogger('[DraftRoomIntegration]');

// ============================================================================
// TYPES
// ============================================================================

interface DraftRoomData {
  id: string;
  name: string;
  status: string;
  currentPickNumber: number;
  participants: Array<{ id: string; name: string }>;
}

interface DraftPickData {
  id: string;
  pickNumber: number;
  playerName: string;
  participantName: string;
  timestamp: number;
}

interface IntegratedDraftRoomProps {
  roomId: string;
  userId: string;
  onDraftComplete?: () => void;
}

// ============================================================================
// ANALYTICS HELPER
// ============================================================================

function trackAnalytics(eventName: string, data: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, data);
  }
  logger.debug('Analytics tracked', { eventName, data });
}

// ============================================================================
// TIMER COMPONENT USING STABLE CALLBACK
// ============================================================================

interface DraftTimerProps {
  isActive: boolean;
  initialSeconds: number;
  onExpire: () => void;
  onTick?: (seconds: number) => void;
}

function DraftTimer({
  isActive,
  initialSeconds,
  onExpire,
  onTick,
}: DraftTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Handler that uses current props
  const handleExpire = useCallback(() => {
    logger.debug('Timer expired');
    trackAnalytics('draft_timer_expired', {
      secondsWas: seconds,
    });
    onExpire();
  }, [onExpire, seconds]); // Include dependencies

  const handleTick = useCallback(
    (s: number) => {
      onTick?.(s);
    },
    [onTick]
  ); // Include onTick dependency

  // Stable callbacks that always call latest handlers
  const stableExpire = useStableCallback(handleExpire as (...args: unknown[]) => unknown);
  const stableTick = useStableCallback(handleTick as (...args: unknown[]) => unknown);

  // Timer effect with empty dependencies (using stable callbacks)
  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    const intervalId = setInterval(() => {
      setSeconds(prevSeconds => {
        const next = prevSeconds - 1;

        // Call stable callbacks
        stableTick(next);

        if (next <= 0) {
          stableExpire();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, seconds, stableExpire, stableTick]); // Include seconds in dependencies

  // Reset when initialSeconds changes
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  // Determine urgency color
  const getTimerColor = (): string => {
    if (seconds <= 5) return 'red';
    if (seconds <= 15) return 'orange';
    return 'green';
  };

  return (
    <div className="timer">
      <span style={{ color: getTimerColor() }}>
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:
        {String(seconds % 60).padStart(2, '0')}
      </span>
    </div>
  );
}

// ============================================================================
// DRAFT PICKS FEED COMPONENT
// ============================================================================

interface DraftPicksFeedProps {
  roomId: string;
  onNewPick: (pick: DraftPickData) => void;
}

function DraftPicksFeed({ roomId, onNewPick }: DraftPicksFeedProps) {
  const [picks, setPicks] = useState<DraftPickData[]>([]);

  // Stable callback for handling new picks
  const handleNewPick = useStableCallback(((pick: DraftPickData) => {
    logger.debug('New pick received', { pickNumber: pick.pickNumber });

    // Track analytics
    trackAnalytics('draft_pick_made', {
      roomId,
      pickNumber: pick.pickNumber,
      playerName: pick.playerName,
    });

    onNewPick(pick);
  }) as (...args: unknown[]) => unknown);

  // Subscribe to real-time picks
  const { data: picksData, error: picksError } = useFirestoreSubscription({
    reference: collection(db!, 'draftRooms', roomId, 'picks'),
    constraints: [orderBy('pickNumber', 'desc'), limit(50)],
    onUpdate: (newPicks) => {
      // Handle the array of picks
      if (Array.isArray(newPicks)) {
        const sortedPicks = (newPicks as DraftPickData[])
          .sort((a, b) => b.pickNumber - a.pickNumber);
        setPicks(sortedPicks);

        // Notify for the newest pick
        if (sortedPicks.length > 0) {
          handleNewPick(sortedPicks[0]!);
        }
      }
    },
    onError: (err) => {
      logger.error('Failed to load picks', err);
      trackAnalytics('draft_picks_error', {
        roomId,
        error: err.message,
      });
    },
    debug: true,
  });

  if (picksError) {
    return <div className="error">Failed to load picks: {picksError}</div>;
  }

  return (
    <div className="picks-feed">
      <h2>Draft Board</h2>
      {picks.length === 0 ? (
        <p>No picks yet...</p>
      ) : (
        <ul>
          {picks.map(pick => (
            <li key={pick.id}>
              Pick #{pick.pickNumber}: {pick.playerName} (by {pick.participantName})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// MAIN INTEGRATED DRAFT ROOM COMPONENT
// ============================================================================

export function IntegratedDraftRoom({
  roomId,
  userId,
  onDraftComplete,
}: IntegratedDraftRoomProps) {
  // =========================================================================
  // STATE MACHINE - Manages draft lifecycle
  // =========================================================================

  const stateMachine = useDraftStateMachine({
    initialState: 'idle',
    onStateChange: (from, to) => {
      logger.debug('Draft state changed', { from, to });

      // Track state transitions
      trackAnalytics('draft_state_changed', {
        roomId,
        from,
        to,
        timestamp: new Date().toISOString(),
      });
    },
    onEnterState: (state) => {
      logger.debug('Entering state', { state });

      if (state === 'loading') {
        logger.debug('Loading draft data...');
      } else if (state === 'connecting') {
        logger.debug('Connecting to real-time updates...');
      } else if (state === 'active') {
        logger.debug('Draft is now active');
        trackAnalytics('draft_started', { roomId });
      } else if (state === 'completed') {
        logger.debug('Draft completed');
        trackAnalytics('draft_completed', { roomId });
        onDraftComplete?.();
      }
    },
    debug: process.env.NODE_ENV === 'development',
  });

  // =========================================================================
  // FIRESTORE SUBSCRIPTIONS - Real-time data
  // =========================================================================

  // Subscribe to room data
  const {
    data: room,
    loading: roomLoading,
    error: roomError,
    isSubscribed: roomSubscribed,
  } = useFirestoreSubscription<DraftRoomData>({
    reference: db ? doc(db, 'draftRooms', roomId) : null as any,
    onUpdate: (roomData) => {
      const data = roomData as DraftRoomData | null;
      logger.debug('Room updated', { status: data?.status });

      // Transition state machine based on room status
      if (data?.status === 'active' && stateMachine.state === 'connecting') {
        stateMachine.transition('active');
      } else if (data?.status === 'completed' && stateMachine.state !== 'completed') {
        stateMachine.transition('completing');
        stateMachine.transition('completed');
      }
    },
    onError: (err) => {
      logger.error('Room subscription error', err);
      stateMachine.transition('error');
    },
    debug: true,
  });

  // =========================================================================
  // STATE TRANSITIONS ON MOUNT
  // =========================================================================

  useEffect(() => {
    // Transition from idle to loading when component mounts
    if (stateMachine.state === 'idle') {
      stateMachine.transition('loading');
    }
  }, [stateMachine]);

  // Transition from loading to connecting when room data arrives
  useEffect(() => {
    if (
      !roomLoading &&
      roomSubscribed &&
      stateMachine.state === 'loading'
    ) {
      stateMachine.transition('connecting');
    }
  }, [roomLoading, roomSubscribed, stateMachine]);

  // =========================================================================
  // HANDLERS WITH STABLE CALLBACKS
  // =========================================================================

  const handleTimerExpire = useStableCallback((() => {
    logger.debug('Timer expired, triggering autopick');
    trackAnalytics('draft_timer_expired', { roomId });

    // Auto-pick logic here
  }) as (...args: unknown[]) => unknown);

  const handleNewPick = useStableCallback(((pick: DraftPickData) => {
    logger.debug('New pick made', { pickNumber: pick.pickNumber });

    // Update UI, animations, etc.
    trackAnalytics('new_pick_received', {
      roomId,
      pickNumber: pick.pickNumber,
    });
  }) as (...args: unknown[]) => unknown);

  // =========================================================================
  // RENDER
  // =========================================================================

  if (roomError) {
    return (
      <div className="draft-room error">
        <h1>Error Loading Draft Room</h1>
        <p>{roomError}</p>
        <button onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }

  if (stateMachine.state === 'idle' || stateMachine.state === 'loading') {
    return (
      <div className="draft-room loading">
        <p>Loading draft room...</p>
      </div>
    );
  }

  if (stateMachine.state === 'connecting') {
    return (
      <div className="draft-room connecting">
        <p>Connecting to real-time updates...</p>
      </div>
    );
  }

  if (stateMachine.state === 'error') {
    return (
      <div className="draft-room error">
        <p>An error occurred. Attempting to recover...</p>
      </div>
    );
  }

  return (
    <div className="draft-room">
      <header>
        <h1>{room?.name}</h1>
        <div className="room-info">
          <span>State: {stateMachine.state}</span>
          <span>Pick: {room?.currentPickNumber}</span>
          <span>Status: {room?.status}</span>
        </div>
      </header>

      <div className="draft-content">
        {/* Timer component uses stable callback */}
        {stateMachine.state === 'active' && (
          <div className="timer-section">
            <DraftTimer
              isActive={true}
              initialSeconds={30}
              onExpire={handleTimerExpire}
            />
          </div>
        )}

        {/* Picks feed with stable callback */}
        <DraftPicksFeed
          roomId={roomId}
          onNewPick={handleNewPick}
        />
      </div>

      <footer>
        <div className="state-info">
          <p>State: {stateMachine.state}</p>
          {stateMachine.lastTransition && (
            <p>Last transition: {stateMachine.lastTransition.from} → {stateMachine.lastTransition.to}</p>
          )}
          <p>Total transitions: {stateMachine.history.length}</p>
        </div>
      </footer>
    </div>
  );
}

export default IntegratedDraftRoom;
