/**
 * Utility functions to clear picks from draft rooms
 */

import { collection, getDocs, deleteDoc, doc, query, limit } from 'firebase/firestore';

import { createScopedLogger } from './clientLogger';
import { db } from './firebase';

const logger = createScopedLogger('[ClearPicks]');

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Utility function to clear all picks for a specific draft room
 * @param roomId - The ID of the draft room
 */
export const clearPicksForRoom = async (roomId: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    logger.debug('Clearing picks for room', { roomId });

    const picksRef = collection(db, 'draftRooms', roomId, 'picks');
    const picksSnapshot = await getDocs(query(picksRef, limit(500)));

    if (picksSnapshot.empty) {
      logger.debug('No picks found to clear');
      return;
    }

    const deletePromises = picksSnapshot.docs.map(pickDoc => {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }
      return deleteDoc(doc(db, 'draftRooms', roomId, 'picks', pickDoc.id));
    });

    await Promise.all(deletePromises);
    logger.debug('Successfully cleared picks', { roomId, count: picksSnapshot.docs.length });
  } catch (error) {
    logger.error(
      'Error clearing picks for room',
      error instanceof Error ? error : new Error(String(error)),
      { roomId },
    );
    throw error;
  }
};

/**
 * Utility function to clear picks for multiple rooms
 * @param roomIds - Array of room IDs to clear picks for
 */
export const clearPicksForMultipleRooms = async (roomIds: string[]): Promise<void> => {
  for (const roomId of roomIds) {
    try {
      await clearPicksForRoom(roomId);
    } catch (error) {
      logger.error(
        'Failed to clear picks for room',
        error instanceof Error ? error : new Error(String(error)),
        { roomId },
      );
    }
  }
};

/**
 * Utility function to clear picks for all completed rooms
 */
export const clearPicksForCompletedRooms = async (): Promise<void> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const roomsRef = collection(db, 'draftRooms');
    const roomsSnapshot = await getDocs(query(roomsRef, limit(100)));

    const completedRooms = roomsSnapshot.docs.filter(doc => doc.data().status === 'completed');

    logger.debug('Found completed rooms', { count: completedRooms.length });

    for (const roomDoc of completedRooms) {
      try {
        await clearPicksForRoom(roomDoc.id);
      } catch (error) {
        logger.error(
          'Failed to clear picks for room',
          error instanceof Error ? error : new Error(String(error)),
          { roomId: roomDoc.id },
        );
      }
    }

    logger.debug('Finished clearing picks for all completed rooms');
  } catch (error) {
    logger.error(
      'Error clearing picks for completed rooms',
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};

// ESM-only — removed legacy module.exports to fix Next.js build error
