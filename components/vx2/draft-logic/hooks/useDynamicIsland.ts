/**
 * useDynamicIsland Hook
 * 
 * React hook for managing Dynamic Island / Live Activity integration
 * with the draft timer. Automatically starts, updates, and ends
 * Live Activities based on draft state.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

import {
  startDraftTimerActivity,
  updateDraftTimerActivity,
  endDraftTimerActivity,
  getDynamicIslandConfig,
  setDynamicIslandEnabled,
  requestLiveActivityPermission,
  isLiveActivitySupported,
  DraftTimerActivityState,
  DynamicIslandConfig,
} from '../../../../lib/dynamicIsland';
import { UPDATE_THROTTLE_MS } from '../../core/constants/timing';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDynamicIslandOptions {
  /** Room ID for the draft */
  roomId: string;
  /** Whether in pre-draft countdown phase */
  isPreDraft?: boolean;
  /** Pre-draft countdown seconds remaining */
  preDraftSeconds?: number;
  /** Scheduled draft start time */
  draftStartTime?: Date | null;
  /** Whether the draft is active (picking phase) */
  isActive: boolean;
  /** Whether the draft is paused */
  isPaused: boolean;
  /** Current timer seconds */
  timerSeconds: number;
  /** Total timer seconds */
  totalSeconds: number;
  /** Whether it's the user's turn */
  isMyTurn: boolean;
  /** Current pick number */
  currentPickNumber: number;
  /** Total picks */
  totalPicks: number;
  /** Current drafter's name */
  currentDrafter: string;
  /** Last picked player name (optional) */
  lastPickedPlayer?: string;
}

export interface UseDynamicIslandResult {
  /** Current configuration */
  config: DynamicIslandConfig;
  /** Whether Dynamic Island is supported on this device */
  isSupported: boolean;
  /** Whether Live Activity is currently running */
  isActivityRunning: boolean;
  /** Enable/disable Dynamic Island */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Request permission for Live Activities */
  requestPermission: () => Promise<boolean>;
  /** Manually start activity (usually automatic) */
  startActivity: () => Promise<void>;
  /** Manually end activity */
  endActivity: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDynamicIsland({
  roomId,
  isPreDraft = false,
  preDraftSeconds = 0,
  draftStartTime,
  isActive,
  isPaused,
  timerSeconds,
  totalSeconds,
  isMyTurn,
  currentPickNumber,
  totalPicks,
  currentDrafter,
  lastPickedPlayer,
}: UseDynamicIslandOptions): UseDynamicIslandResult {
  const [config, setConfig] = useState<DynamicIslandConfig>(getDynamicIslandConfig);
  const [isActivityRunning, setIsActivityRunning] = useState(false);
  const activityIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Determine if we should show activity (pre-draft OR active draft)
  const shouldShowActivity = isPreDraft || isActive;
  
  // Get effective timer (pre-draft countdown or pick timer)
  const effectiveTimerSeconds = isPreDraft ? preDraftSeconds : timerSeconds;
  const effectiveTotalSeconds = isPreDraft ? preDraftSeconds : totalSeconds;
  
  // Refresh config on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing configuration on mount
    setConfig(getDynamicIslandConfig());
  }, []);
  
  // Get current status
  const getStatus = useCallback((): DraftTimerActivityState['status'] => {
    if (isPreDraft) return 'pre_draft';
    if (!isActive) return 'completed';
    if (isPaused) return 'paused';
    if (timerSeconds <= 0) return 'expired';
    return 'active';
  }, [isPreDraft, isActive, isPaused, timerSeconds]);
  
  // Start activity
  const startActivity = useCallback(async () => {
    if (!config.enabled || !config.isSupported) return;
    if (activityIdRef.current) return; // Already running
    
    const activityId = await startDraftTimerActivity({
      roomId,
      secondsRemaining: effectiveTimerSeconds,
      totalSeconds: effectiveTotalSeconds,
      isMyTurn: isPreDraft ? false : isMyTurn,
      currentPickNumber: isPreDraft ? 0 : currentPickNumber,
      totalPicks,
      currentDrafter: isPreDraft ? 'Draft starting soon...' : currentDrafter,
      status: getStatus(),
      lastPickedPlayer,
      draftStartTime: draftStartTime?.toISOString(),
    });
    
    if (activityId) {
      activityIdRef.current = activityId;
      setIsActivityRunning(true);
    }
  }, [config.enabled, config.isSupported, roomId, effectiveTimerSeconds, effectiveTotalSeconds, isPreDraft, isMyTurn, currentPickNumber, totalPicks, currentDrafter, getStatus, lastPickedPlayer, draftStartTime]);
  
  // End activity
  const endActivity = useCallback(async () => {
    if (activityIdRef.current) {
      await endDraftTimerActivity(activityIdRef.current, 'cancelled');
      activityIdRef.current = null;
      setIsActivityRunning(false);
    }
  }, []);
  
  // Update activity
  const updateActivity = useCallback(async () => {
    if (!activityIdRef.current) return;
    
    // Throttle updates
    const now = Date.now();
    if (now - lastUpdateRef.current < UPDATE_THROTTLE_MS) return;
    lastUpdateRef.current = now;
    
    await updateDraftTimerActivity({
      activityId: activityIdRef.current,
      secondsRemaining: effectiveTimerSeconds,
      isMyTurn: isPreDraft ? false : isMyTurn,
      currentPickNumber: isPreDraft ? 0 : currentPickNumber,
      currentDrafter: isPreDraft ? 'Draft starting soon...' : currentDrafter,
      status: getStatus(),
      lastPickedPlayer,
    });
  }, [effectiveTimerSeconds, isPreDraft, isMyTurn, currentPickNumber, currentDrafter, getStatus, lastPickedPlayer]);
  
  // Auto-start when pre-draft countdown begins OR draft becomes active
  useEffect(() => {
    if (shouldShowActivity && config.enabled && !activityIdRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      startActivity();
    }
  }, [shouldShowActivity, config.enabled, startActivity]);
  
  // Auto-end when draft completes (not during transition from pre-draft to active)
  useEffect(() => {
    if (!shouldShowActivity && activityIdRef.current) {
      endDraftTimerActivity(activityIdRef.current, 'completed');
      activityIdRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setIsActivityRunning(false);
    }
  }, [shouldShowActivity]);
  
  // Update activity on state changes
  useEffect(() => {
    if (activityIdRef.current) {
      updateActivity();
    }
  }, [effectiveTimerSeconds, isMyTurn, currentPickNumber, isPaused, isPreDraft, updateActivity]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activityIdRef.current) {
        endDraftTimerActivity(activityIdRef.current, 'left');
      }
    };
  }, []);
  
  // Set enabled
  const setEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && !config.hasPermission) {
      const granted = await requestLiveActivityPermission();
      if (!granted) {
        // Permission denied - this is expected behavior, no need to log
        return;
      }
    }
    
    setDynamicIslandEnabled(enabled);
    setConfig(getDynamicIslandConfig());
    
    if (enabled && shouldShowActivity && !activityIdRef.current) {
      startActivity();
    } else if (!enabled && activityIdRef.current) {
      endActivity();
    }
  }, [config.hasPermission, shouldShowActivity, startActivity, endActivity]);
  
  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestLiveActivityPermission();
    setConfig(getDynamicIslandConfig());
    return granted;
  }, []);
  
  return {
    config,
    isSupported: isLiveActivitySupported(),
    isActivityRunning,
    setEnabled,
    requestPermission,
    startActivity,
    endActivity,
  };
}

export default useDynamicIsland;

