/**
 * useDraftActions
 * 
 * Hook for draft actions: making picks, auto-picking, validation.
 * Wraps draft pick service and integrates with context.
 * 
 * Part of Phase 2: Extract Hooks
 */

import { useCallback, useRef } from 'react';
import { useDraftState, useDraftDispatch } from '../context/DraftRoomContext';
import { makePick, makeAutoPick } from '../services/draftPickService';
import { canDraftPlayer } from '../services/draftValidationService';
import { logger } from '@/lib/structuredLogger';
import { Player } from '../types/draft';

export interface UseDraftActionsResult {
  makePickAction: (playerName: string) => Promise<boolean>;
  makeAutoPickAction: (playerName: string, pickerName?: string, pickNumber?: number) => Promise<boolean>;
  canDraftPlayerAction: (playerName: string) => boolean;
  isPickInProgress: boolean;
}

/**
 * Hook for draft actions (picking, auto-picking)
 */
export function useDraftActions(): UseDraftActionsResult {
  const state = useDraftState();
  const dispatch = useDraftDispatch();
  const pickInProgressRef = useRef(false);

  const { room, picks, currentUser } = state;

  // Calculate current pick info
  const currentPickNumber = picks.length + 1;
  const currentRound = room?.draftOrder
    ? Math.ceil(currentPickNumber / room.draftOrder.length)
    : 1;
  const draftOrder = room?.draftOrder || [];

  // Make a pick
  const makePickAction = useCallback(
    async (playerName: string): Promise<boolean> => {
      if (!room?.id || !currentUser) {
        logger.warn('Cannot make pick: missing room or user', {
          roomId: room?.id,
          currentUser,
          component: 'useDraftActions',
        });
        return false;
      }

      if (pickInProgressRef.current) {
        logger.warn('Pick already in progress', {
          roomId: room.id,
          component: 'useDraftActions',
        });
        return false;
      }

      if (state.timer <= 0 && !state.isInGracePeriod) {
        logger.warn('Cannot make pick: timer expired', {
          roomId: room.id,
          component: 'useDraftActions',
        });
        return false;
      }

      // Validate it's user's turn
      const currentPickerIndex = (currentPickNumber - 1) % draftOrder.length;
      const expectedPicker = draftOrder[currentPickerIndex];
      if (expectedPicker !== currentUser) {
        logger.warn('Cannot make pick: not user turn', {
          roomId: room.id,
          currentUser,
          expectedPicker,
          component: 'useDraftActions',
        });
        return false;
      }

      // Validate positional limits
      const userPicks = picks.filter((p) => p.user === currentUser);
      if (!canDraftPlayer({ playerName, userPicks })) {
        logger.warn('Cannot make pick: positional limit reached', {
          roomId: room.id,
          playerName,
          component: 'useDraftActions',
        });
        return false;
      }

      try {
        pickInProgressRef.current = true;

        const result = await makePick({
          roomId: room.id,
          playerName,
          userName: currentUser,
          currentPickNumber,
          currentRound,
          draftOrder,
        });

        if (result.success && result.pickData) {
          // Pick will be added via Firebase listener, but we can optimistically update
          dispatch({ type: 'ADD_PICK', payload: result.pickData });
          return true;
        } else {
          logger.error('Pick failed', undefined, {
            roomId: room.id,
            error: result.error,
            component: 'useDraftActions',
          });
          return false;
        }
      } catch (error) {
        logger.error('Pick error', error, {
          roomId: room.id,
          component: 'useDraftActions',
        });
        return false;
      } finally {
        pickInProgressRef.current = false;
      }
    },
    [room, picks, currentUser, currentPickNumber, currentRound, draftOrder, state.timer, state.isInGracePeriod, dispatch]
  );

  // Make an auto-pick
  const makeAutoPickAction = useCallback(
    async (
      playerName: string,
      pickerName?: string,
      pickNumber?: number
    ): Promise<boolean> => {
      if (!room?.id) {
        return false;
      }

      if (pickInProgressRef.current) {
        return false;
      }

      const actualPicker = pickerName || currentUser;
      const actualPickNumber = pickNumber || currentPickNumber;
      const actualRound = room.draftOrder
        ? Math.ceil(actualPickNumber / room.draftOrder.length)
        : 1;

      try {
        pickInProgressRef.current = true;

        const result = await makeAutoPick({
          roomId: room.id,
          playerName,
          pickerName: actualPicker,
          pickNumber: actualPickNumber,
          round: actualRound,
          draftOrder,
        });

        if (result.success && result.pickData) {
          // Pick will be added via Firebase listener
          return true;
        }

        return false;
      } catch (error) {
        logger.error('Auto-pick error', error, {
          roomId: room.id,
          component: 'useDraftActions',
        });
        return false;
      } finally {
        pickInProgressRef.current = false;
      }
    },
    [room, currentUser, currentPickNumber, draftOrder]
  );

  // Check if player can be drafted
  const canDraftPlayerAction = useCallback(
    (playerName: string): boolean => {
      const userPicks = picks.filter((p) => p.user === currentUser);
      return canDraftPlayer({ playerName, userPicks });
    },
    [picks, currentUser]
  );

  return {
    makePickAction,
    makeAutoPickAction,
    canDraftPlayerAction,
    isPickInProgress: pickInProgressRef.current,
  };
}
