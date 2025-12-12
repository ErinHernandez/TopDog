/**
 * VX2 Draft Logic - Pick Executor Hook
 * 
 * Handles pick execution with validation.
 * All new implementation - no code reuse.
 */

import { useCallback, useRef } from 'react';
import type { 
  DraftPlayer, 
  DraftPick,
  DraftStatus,
  PositionLimits,
  PositionCounts,
  PickSource,
  ValidationResult,
  DraftAdapter,
} from '../types';
import { DRAFT_CONFIG } from '../constants';
// Direct imports to avoid barrel export issues with Turbopack
import { validateManualPick, validateAutopick } from '../utils/validation';
import { getParticipantForPick, getRoundForPick, getPickInRound } from '../utils/snakeDraft';
import { calculatePositionCounts } from '../utils/autodraft';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePickExecutorOptions {
  /** Data adapter */
  adapter: DraftAdapter | null;
  /** Room ID */
  roomId: string;
  /** Current pick number */
  currentPickNumber: number;
  /** User's participant index */
  userParticipantIndex: number;
  /** Team count */
  teamCount?: number;
  /** Set of picked player IDs */
  pickedPlayerIds: Set<string>;
  /** User's current roster */
  currentRoster: DraftPlayer[];
  /** Position limits */
  positionLimits: PositionLimits;
  /** Current draft status */
  draftStatus: DraftStatus;
  /** Callback after successful pick */
  onPickSuccess?: (pick: DraftPick) => void;
  /** Callback on pick error */
  onPickError?: (error: string) => void;
}

export interface UsePickExecutorResult {
  /** Execute a manual pick */
  executePick: (player: DraftPlayer) => Promise<boolean>;
  /** Execute an autopick */
  executeAutopick: (player: DraftPlayer, source: PickSource) => Promise<boolean>;
  /** Validate a pick without executing */
  validatePick: (player: DraftPlayer) => ValidationResult;
  /** Whether a pick is currently in progress */
  isExecuting: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePickExecutor({
  adapter,
  roomId,
  currentPickNumber,
  userParticipantIndex,
  teamCount = DRAFT_CONFIG.teamCount,
  pickedPlayerIds,
  currentRoster,
  positionLimits,
  draftStatus,
  onPickSuccess,
  onPickError,
}: UsePickExecutorOptions): UsePickExecutorResult {
  // Prevent concurrent picks
  const isExecutingRef = useRef(false);
  
  // Validate a pick
  const validatePick = useCallback((player: DraftPlayer): ValidationResult => {
    return validateManualPick(
      player,
      currentPickNumber,
      userParticipantIndex,
      teamCount,
      pickedPlayerIds,
      currentRoster,
      positionLimits,
      draftStatus
    );
  }, [
    currentPickNumber, 
    userParticipantIndex, 
    teamCount, 
    pickedPlayerIds, 
    currentRoster, 
    positionLimits, 
    draftStatus
  ]);
  
  // Build pick object
  const buildPick = useCallback((
    player: DraftPlayer,
    isAutopick: boolean,
    source: PickSource
  ): Omit<DraftPick, 'id'> => {
    const participantIndex = getParticipantForPick(currentPickNumber, teamCount);
    const rosterAtPick = calculatePositionCounts(currentRoster);
    
    return {
      pickNumber: currentPickNumber,
      round: getRoundForPick(currentPickNumber, teamCount),
      pickInRound: getPickInRound(currentPickNumber, teamCount),
      player,
      participantId: `participant-${participantIndex}`,
      participantIndex,
      timestamp: Date.now(),
      isAutopick,
      source,
      rosterAtPick,
    };
  }, [currentPickNumber, teamCount, currentRoster]);
  
  // Execute a manual pick
  const executePick = useCallback(async (player: DraftPlayer): Promise<boolean> => {
    // Prevent concurrent execution
    if (isExecutingRef.current) {
      return false;
    }
    
    // Validate
    const validation = validatePick(player);
    if (!validation.valid) {
      onPickError?.(validation.errorMessage ?? 'Invalid pick');
      return false;
    }
    
    // Check adapter
    if (!adapter) {
      onPickError?.('No adapter available');
      return false;
    }
    
    isExecutingRef.current = true;
    
    try {
      const pickData = buildPick(player, false, 'manual');
      const pick = await adapter.addPick(roomId, pickData);
      
      onPickSuccess?.(pick);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute pick';
      onPickError?.(message);
      return false;
    } finally {
      isExecutingRef.current = false;
    }
  }, [adapter, roomId, validatePick, buildPick, onPickSuccess, onPickError]);
  
  // Execute an autopick
  const executeAutopick = useCallback(async (
    player: DraftPlayer,
    source: PickSource
  ): Promise<boolean> => {
    // Prevent concurrent execution
    if (isExecutingRef.current) {
      return false;
    }
    
    // Validate (skip turn validation for autopick)
    const validation = validateAutopick(
      player,
      pickedPlayerIds,
      currentRoster,
      positionLimits,
      draftStatus
    );
    
    if (!validation.valid) {
      onPickError?.(validation.errorMessage ?? 'Invalid autopick');
      return false;
    }
    
    // Check adapter
    if (!adapter) {
      onPickError?.('No adapter available');
      return false;
    }
    
    isExecutingRef.current = true;
    
    try {
      const pickData = buildPick(player, true, source);
      const pick = await adapter.addPick(roomId, pickData);
      
      onPickSuccess?.(pick);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute autopick';
      onPickError?.(message);
      return false;
    } finally {
      isExecutingRef.current = false;
    }
  }, [
    adapter, 
    roomId, 
    pickedPlayerIds, 
    currentRoster, 
    positionLimits, 
    draftStatus, 
    buildPick, 
    onPickSuccess, 
    onPickError
  ]);
  
  return {
    executePick,
    executeAutopick,
    validatePick,
    isExecuting: isExecutingRef.current,
  };
}

export default usePickExecutor;

