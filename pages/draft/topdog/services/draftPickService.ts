/**
 * draftPickService
 * 
 * Service for submitting draft picks via Firebase transactions.
 * Handles validation and atomic pick submission.
 * 
 * Part of Phase 2: Extract Services
 */

import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/structuredLogger';
import { DraftPick } from '../types/draft';

export interface MakePickOptions {
  roomId: string;
  playerName: string;
  userName: string;
  currentPickNumber: number;
  currentRound: number;
  draftOrder: string[];
}

export interface MakePickResult {
  success: boolean;
  error?: string;
  pickData?: DraftPick;
}

/**
 * Submit a draft pick via Firebase transaction
 */
export async function makePick({
  roomId,
  playerName,
  userName,
  currentPickNumber,
  currentRound,
  draftOrder,
}: MakePickOptions): Promise<MakePickResult> {
  if (!db) {
    return { success: false, error: 'Firebase Firestore is not initialized' };
  }
  try {
    // db is guaranteed to be non-null here due to check above
    const pickData = await runTransaction(db!, async (transaction) => {
      const roomRef = doc(db!, 'draftRooms', roomId);
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists()) {
        throw new Error('Draft room not found');
      }

      const roomData = roomDoc.data();

      // Validate pick number
      if (roomData.currentPick !== currentPickNumber) {
        throw new Error(
          `Pick number mismatch: expected ${roomData.currentPick}, got ${currentPickNumber}`
        );
      }

      // Validate it's user's turn
      const currentPickerIndex = (currentPickNumber - 1) % draftOrder.length;
      const expectedPicker = draftOrder[currentPickerIndex];
      if (expectedPicker !== userName) {
        throw new Error(`Not your turn: expected ${expectedPicker}, got ${userName}`);
      }

      // Create pick document
      const pickRef = doc(db!, 'draftRooms', roomId, 'picks', String(currentPickNumber));
      const pickData = {
        pickNumber: currentPickNumber,
        round: currentRound,
        user: userName,
        player: playerName,
        roomId: roomId,
        timestamp: serverTimestamp(),
      };

      // Atomically update room and create pick
      transaction.set(pickRef, pickData);
      transaction.update(roomRef, {
        currentPick: currentPickNumber + 1,
        lastPickAt: serverTimestamp(),
      });

      return pickData;
    });

    logger.info('Pick made successfully', {
      roomId,
      userName,
      playerName,
      pickNumber: currentPickNumber,
      component: 'draftPickService',
    });

    return {
      success: true,
      pickData: pickData as DraftPick,
    };
  } catch (error) {
    logger.error('Pick failed', error, {
      roomId,
      userName,
      playerName,
      pickNumber: currentPickNumber,
      component: 'draftPickService',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit an auto-pick (for mock drafters or time expiration)
 */
export async function makeAutoPick({
  roomId,
  playerName,
  pickerName,
  pickNumber,
  round,
  draftOrder,
}: {
  roomId: string;
  playerName: string;
  pickerName: string;
  pickNumber: number;
  round: number;
  draftOrder: string[];
}): Promise<MakePickResult> {
  if (!db) {
    return { success: false, error: 'Firebase Firestore is not initialized' };
  }
  try {
    // db is guaranteed to be non-null here due to check above
    const pickData = await runTransaction(db!, async (transaction) => {
      const roomRef = doc(db!, 'draftRooms', roomId);
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists()) {
        throw new Error('Draft room not found');
      }

      const roomData = roomDoc.data();

      // Validate pick number
      if (roomData.currentPick !== pickNumber) {
        throw new Error(
          `Auto-pick number mismatch: expected ${roomData.currentPick}, got ${pickNumber}`
        );
      }

      // Validate it's the correct picker's turn
      const currentPickerIndex = (pickNumber - 1) % draftOrder.length;
      const expectedPicker = draftOrder[currentPickerIndex];
      if (expectedPicker !== pickerName) {
        throw new Error(`Auto-pick wrong picker: expected ${expectedPicker}, got ${pickerName}`);
      }

      // Create pick document
      const pickRef = doc(db!, 'draftRooms', roomId, 'picks', String(pickNumber));
      const pickData = {
        pickNumber,
        round,
        user: pickerName,
        player: playerName,
        roomId: roomId,
        timestamp: serverTimestamp(),
      };

      // Atomically update room and create pick
      transaction.set(pickRef, pickData);
      transaction.update(roomRef, {
        currentPick: pickNumber + 1,
        lastPickAt: serverTimestamp(),
      });

      return pickData;
    });

    logger.info('Auto-pick made successfully', {
      roomId,
      pickerName,
      playerName,
      pickNumber,
      component: 'draftPickService',
    });

    return {
      success: true,
      pickData: pickData as DraftPick,
    };
  } catch (error) {
    logger.error('Auto-pick failed', error, {
      roomId,
      pickerName,
      playerName,
      pickNumber,
      component: 'draftPickService',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
