/**
 * VX2 Draft Logic - Synchronized Draft Timer Hook
 *
 * Server-synchronized timer that uses Firestore timestamps as the source of truth.
 * This prevents timer drift and ensures all clients see consistent countdown.
 *
 * Key features:
 * - Uses server timestamp (timerStartedAt) as reference
 * - Compensates for client/server clock differences
 * - Handles reconnection gracefully
 * - Supports grace period after timer expires
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type { TimerState, TimerUrgency, TimerStatus } from '../types';
import { DRAFT_CONFIG } from '../constants';
import { formatTimer, getTimerUrgency } from '../utils/timer';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[SyncedTimer]');

// ============================================================================
// TYPES
// ============================================================================

export interface UseSyncedDraftTimerOptions {
  /** Room ID for Firestore subscription */
  roomId: string;
  /** Total seconds per pick */
  pickTimeSeconds?: number;
  /** Grace period duration in seconds */
  gracePeriodSeconds?: number;
  /** Whether the draft is currently active */
  isActive: boolean;
  /** Callback when timer expires (after grace period) */
  onExpire?: () => void;
  /** Callback when grace period starts */
  onGracePeriodStart?: () => void;
  /** Callback on each tick */
  onTick?: (secondsRemaining: number) => void;
}

export interface UseSyncedDraftTimerResult {
  /** Current timer state */
  state: TimerState;
  /** Seconds remaining */
  secondsRemaining: number;
  /** Formatted time string (e.g., "0:30") */
  formattedTime: string;
  /** Urgency level for styling */
  urgency: TimerUrgency;
  /** Whether in grace period */
  isInGracePeriod: boolean;
  /** Whether timer is running */
  isRunning: boolean;
  /** Full timer status */
  status: TimerStatus;
  /** Server time offset (client - server) in ms */
  serverTimeOffset: number;
  /** Whether synced with server */
  isSynced: boolean;
  /** Reset and restart timer (triggers server update) */
  resetTimer: () => Promise<void>;
}

interface RoomTimerData {
  timerStartedAt?: Timestamp;
  pickTimeSeconds?: number;
  status?: string;
  currentPickNumber?: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSyncedDraftTimer({
  roomId,
  pickTimeSeconds = DRAFT_CONFIG.pickTimeSeconds,
  gracePeriodSeconds = DRAFT_CONFIG.gracePeriodSeconds,
  isActive,
  onExpire,
  onGracePeriodStart,
  onTick,
}: UseSyncedDraftTimerOptions): UseSyncedDraftTimerResult {
  // State
  const [secondsRemaining, setSecondsRemaining] = useState(pickTimeSeconds);
  const [state, setState] = useState<TimerState>('idle');
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);

  // Refs for callbacks to avoid stale closures
  const onExpireRef = useRef(onExpire);
  const onGracePeriodStartRef = useRef(onGracePeriodStart);
  const onTickRef = useRef(onTick);
  const hasExpiredRef = useRef(false);
  const gracePeriodTriggeredRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onExpireRef.current = onExpire;
    onGracePeriodStartRef.current = onGracePeriodStart;
    onTickRef.current = onTick;
  }, [onExpire, onGracePeriodStart, onTick]);

  // Derived state
  const isInGracePeriod = state === 'grace_period';
  const isRunning = isActive && state === 'running';

  // -------------------------------------------------------------------------
  // SERVER TIME OFFSET CALCULATION
  // -------------------------------------------------------------------------

  // Calculate offset between client and server time
  // This is done by comparing the timerStartedAt timestamp with when we received it
  useEffect(() => {
    if (!db || !roomId) return;

    // We'll estimate server time offset when we first receive a timestamp
    // For production, you might want a dedicated time sync endpoint
    const estimateOffset = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.timestamp) {
          const serverTime = new Date(data.timestamp).getTime();
          const clientTime = Date.now();
          const offset = clientTime - serverTime;
          setServerTimeOffset(offset);
          logger.info('Server time offset calculated', { offset });
        }
      } catch {
        // Use 0 offset if we can't sync
        logger.warn('Could not calculate server time offset');
      }
    };

    estimateOffset();
  }, [roomId]);

  // -------------------------------------------------------------------------
  // FIRESTORE SUBSCRIPTION
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!db || !roomId || !isActive) {
      setState('idle');
      return;
    }

    const roomRef = doc(db, 'draftRooms', roomId);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          logger.warn('Room not found', { roomId });
          return;
        }

        const data = snapshot.data() as RoomTimerData;

        // Update timer start time if changed
        if (data.timerStartedAt) {
          const serverTimerStart = data.timerStartedAt.toMillis();
          setTimerStartedAt(serverTimerStart);
          setIsSynced(true);

          // Reset expired flags when new timer starts
          hasExpiredRef.current = false;
          gracePeriodTriggeredRef.current = false;

          logger.info('Timer synced from server', { timerStartedAt: serverTimerStart });
        }

        // Check if draft is still active
        if (data.status !== 'active') {
          setState('idle');
        }
      },
      (error) => {
        logger.error('Timer subscription error', { roomId, error });
        setIsSynced(false);
      }
    );

    return () => unsubscribe();
  }, [db, roomId, isActive]);

  // -------------------------------------------------------------------------
  // LOCAL COUNTDOWN (synced to server time)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!isActive || !timerStartedAt || state === 'expired') {
      return;
    }

    const calculateRemaining = () => {
      // Calculate remaining time based on server timestamp
      const now = Date.now() - serverTimeOffset; // Adjust for offset
      const elapsedMs = now - timerStartedAt;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remaining = pickTimeSeconds - elapsedSeconds;

      return remaining;
    };

    // Initial calculation
    const remaining = calculateRemaining();
    setSecondsRemaining(Math.max(0, remaining));

    if (remaining > 0) {
      setState('running');
    } else if (remaining > -gracePeriodSeconds) {
      // In grace period
      if (!gracePeriodTriggeredRef.current) {
        gracePeriodTriggeredRef.current = true;
        setState('grace_period');
        onGracePeriodStartRef.current?.();
      }
    } else {
      // Fully expired
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        setState('expired');
        onExpireRef.current?.();
      }
    }

    // Update every second
    const intervalId = setInterval(() => {
      const remaining = calculateRemaining();
      const displayRemaining = Math.max(0, remaining);

      setSecondsRemaining(displayRemaining);
      onTickRef.current?.(displayRemaining);

      if (remaining > 0) {
        setState('running');
      } else if (remaining > -gracePeriodSeconds) {
        // In grace period
        if (!gracePeriodTriggeredRef.current) {
          gracePeriodTriggeredRef.current = true;
          setState('grace_period');
          onGracePeriodStartRef.current?.();
        }
      } else {
        // Fully expired
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          setState('expired');
          onExpireRef.current?.();
          clearInterval(intervalId);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, timerStartedAt, pickTimeSeconds, gracePeriodSeconds, serverTimeOffset, state]);

  // -------------------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------------------

  const resetTimer = useCallback(async () => {
    if (!db || !roomId) {
      logger.error('Cannot reset timer: db or roomId not available');
      return;
    }

    try {
      const roomRef = doc(db, 'draftRooms', roomId);
      await updateDoc(roomRef, {
        timerStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Reset local state
      hasExpiredRef.current = false;
      gracePeriodTriggeredRef.current = false;
      setState('running');
      setSecondsRemaining(pickTimeSeconds);

      logger.info('Timer reset on server', { roomId });
    } catch (error) {
      logger.error('Failed to reset timer', { roomId, error });
      throw error;
    }
  }, [db, roomId, pickTimeSeconds]);

  // -------------------------------------------------------------------------
  // BUILD RESULT
  // -------------------------------------------------------------------------

  const status: TimerStatus = {
    state,
    secondsRemaining,
    urgency: getTimerUrgency(secondsRemaining),
    isInGracePeriod,
  };

  return {
    state,
    secondsRemaining,
    formattedTime: formatTimer(secondsRemaining),
    urgency: getTimerUrgency(secondsRemaining),
    isInGracePeriod,
    isRunning,
    status,
    serverTimeOffset,
    isSynced,
    resetTimer,
  };
}

export default useSyncedDraftTimer;
