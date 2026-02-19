/**
 * useDraftAlerts Hook
 *
 * Monitors draft state and triggers alerts based on conditions
 * CORRECTED: Fixed timer threshold, added error handling, round context
 */

import { useEffect, useRef, useCallback } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';
import { alertManager } from '../../../../lib/draftAlerts/alertManager';
import { DEFAULT_ALERT_PREFERENCES } from '../../../../lib/draftAlerts/constants';
import { DraftAlertType, AlertTriggerContext } from '../../../../lib/draftAlerts/types';
import { isLiveActivitySupported, isDynamicIslandSupported } from '../../../../lib/dynamicIsland';
import { useAuth } from '../../auth/hooks/useAuth';

const logger = createScopedLogger('[useDraftAlerts]');

export interface UseDraftAlertsOptions {
  roomId: string;
  participants: Array<{ id: string; name: string }>;
  maxParticipants: number;
  roomStatus: 'waiting' | 'active' | 'paused' | 'completed';
  preDraftCountdown: number;
  picksUntilMyTurn: number;
  isMyTurn: boolean;
  timer: number;
  currentRound: number;  // ADDED
  currentPick: number;   // ADDED
}

export function useDraftAlerts({
  roomId,
  participants,
  maxParticipants,
  roomStatus,
  preDraftCountdown,
  picksUntilMyTurn,
  isMyTurn,
  timer,
  currentRound,
  currentPick,
}: UseDraftAlertsOptions): void {
  const { profile } = useAuth();
  
  // Track previous values to detect transitions
  const prevValues = useRef({
    participantsLength: 0,
    preDraftCountdown: 0,
    picksUntilMyTurn: Infinity,
    isMyTurn: false,
    timer: Infinity,
  });

  // Initialize alert manager
  // CORRECTED: Always enabled - delivery method varies by device
  useEffect(() => {
    const preferences = profile?.preferences?.draftAlerts ?? DEFAULT_ALERT_PREFERENCES;
    
    alertManager.initialize({
      enabled: true, // Always enabled - delivery method varies by device
      preferences,
      isDynamicIslandSupported: isDynamicIslandSupported() || isLiveActivitySupported(),
      isWebNotificationSupported: 'Notification' in window,
    });
  }, [profile]);

  // CORRECTED: Safe alert triggering with error handling
  const safelyTriggerAlert = useCallback(async (
    alertType: DraftAlertType,
    context: AlertTriggerContext
  ) => {
    try {
      await alertManager.triggerAlert(alertType, context);
    } catch (error) {
      // Log but don't crash the draft experience
      logger.error(`Failed to trigger ${alertType}:`, error instanceof Error ? error : new Error(String(error)));
    }
  }, []);

  // Alert 1: Room Filled
  useEffect(() => {
    const wasFull = prevValues.current.participantsLength === maxParticipants;
    const isFull = participants.length === maxParticipants;
    
    if (!wasFull && isFull) {
      const context: AlertTriggerContext = {
        roomId,
        participants,
        maxParticipants,
        roomStatus,
        preDraftCountdown,
        picksUntilMyTurn,
        isMyTurn,
        timer,
        currentRound,
        currentPick,
      };
      
      safelyTriggerAlert(DraftAlertType.ROOM_FILLED, context);
    }
    
    prevValues.current.participantsLength = participants.length;
  }, [participants, maxParticipants, roomId, roomStatus, preDraftCountdown, picksUntilMyTurn, isMyTurn, timer, currentRound, currentPick, safelyTriggerAlert]);

  // Alert 2: Draft Starting
  useEffect(() => {
    const wasCountdownActive = prevValues.current.preDraftCountdown > 0;
    const isCountdownActive = preDraftCountdown > 0 && preDraftCountdown <= 60;
    
    if (!wasCountdownActive && isCountdownActive && roomStatus === 'waiting') {
      const context: AlertTriggerContext = {
        roomId,
        participants,
        maxParticipants,
        roomStatus,
        preDraftCountdown,
        picksUntilMyTurn,
        isMyTurn,
        timer,
        currentRound,
        currentPick,
      };
      
      safelyTriggerAlert(DraftAlertType.DRAFT_STARTING, context);
    }
    
    prevValues.current.preDraftCountdown = preDraftCountdown;
  }, [preDraftCountdown, roomStatus, roomId, participants, maxParticipants, picksUntilMyTurn, isMyTurn, timer, currentRound, currentPick, safelyTriggerAlert]);

  // Alert 3: Two Picks Away
  useEffect(() => {
    const wasTwoAway = prevValues.current.picksUntilMyTurn === 2;
    const isTwoAway = picksUntilMyTurn === 2;
    
    if (!wasTwoAway && isTwoAway && roomStatus === 'active') {
      const context: AlertTriggerContext = {
        roomId,
        participants,
        maxParticipants,
        roomStatus,
        preDraftCountdown,
        picksUntilMyTurn,
        isMyTurn,
        timer,
        currentRound,
        currentPick,
      };
      
      safelyTriggerAlert(DraftAlertType.TWO_PICKS_AWAY, context);
    }
    
    prevValues.current.picksUntilMyTurn = picksUntilMyTurn;
  }, [picksUntilMyTurn, roomStatus, roomId, participants, maxParticipants, preDraftCountdown, isMyTurn, timer, currentRound, currentPick, safelyTriggerAlert]);

  // Alert 4: On The Clock
  useEffect(() => {
    const wasMyTurn = prevValues.current.isMyTurn;
    const isMyTurnNow = isMyTurn && timer > 0;
    
    if (!wasMyTurn && isMyTurnNow && roomStatus === 'active') {
      const context: AlertTriggerContext = {
        roomId,
        participants,
        maxParticipants,
        roomStatus,
        preDraftCountdown,
        picksUntilMyTurn,
        isMyTurn,
        timer,
        currentRound,
        currentPick,
      };
      
      safelyTriggerAlert(DraftAlertType.ON_THE_CLOCK, context);
    }
    
    prevValues.current.isMyTurn = isMyTurn;
  }, [isMyTurn, timer, roomStatus, roomId, participants, maxParticipants, preDraftCountdown, picksUntilMyTurn, currentRound, currentPick, safelyTriggerAlert]);

  // Alert 5: 10 Seconds Remaining
  // CORRECTED: Changed from === 10 to <= 10 threshold detection
  useEffect(() => {
    const wasAboveTen = prevValues.current.timer > 10;
    const isAtOrBelowTen = timer <= 10;
    const isTimerActive = isMyTurn && timer > 0;
    
    // Fire when crossing the 10-second threshold (not exactly === 10)
    if (wasAboveTen && isAtOrBelowTen && isTimerActive && roomStatus === 'active') {
      const context: AlertTriggerContext = {
        roomId,
        participants,
        maxParticipants,
        roomStatus,
        preDraftCountdown,
        picksUntilMyTurn,
        isMyTurn,
        timer,
        currentRound,
        currentPick,
      };
      
      safelyTriggerAlert(DraftAlertType.TEN_SECONDS_REMAINING, context);
    }
    
    prevValues.current.timer = timer;
  }, [timer, isMyTurn, roomStatus, roomId, participants, maxParticipants, preDraftCountdown, picksUntilMyTurn, currentRound, currentPick, safelyTriggerAlert]);
}
