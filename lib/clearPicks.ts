/**
 * Utility functions to clear picks from draft rooms
 */

import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
    console.log(`Clearing picks for room: ${roomId}`);
    
    const picksRef = collection(db, 'draftRooms', roomId, 'picks');
    const picksSnapshot = await getDocs(picksRef);
    
    if (picksSnapshot.empty) {
      console.log('No picks found to clear');
      return;
    }
    
    const deletePromises = picksSnapshot.docs.map(pickDoc => {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }
      return deleteDoc(doc(db, 'draftRooms', roomId, 'picks', pickDoc.id));
    });
    
    await Promise.all(deletePromises);
    console.log(`Successfully cleared ${picksSnapshot.docs.length} picks from room ${roomId}`);
    
  } catch (error) {
    console.error(`Error clearing picks for room ${roomId}:`, error);
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
      console.error(`Failed to clear picks for room ${roomId}:`, error);
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
    const roomsSnapshot = await getDocs(roomsRef);
    
    const completedRooms = roomsSnapshot.docs.filter(doc => 
      doc.data().status === 'completed'
    );
    
    console.log(`Found ${completedRooms.length} completed rooms`);
    
    for (const roomDoc of completedRooms) {
      try {
        await clearPicksForRoom(roomDoc.id);
      } catch (error) {
        console.error(`Failed to clear picks for room ${roomDoc.id}:`, error);
      }
    }
    
    console.log('Finished clearing picks for all completed rooms');
    
  } catch (error) {
    console.error('Error clearing picks for completed rooms:', error);
    throw error;
  }
};

// CommonJS exports for backward compatibility
module.exports = {
  clearPicksForRoom,
  clearPicksForMultipleRooms,
  clearPicksForCompletedRooms
};
