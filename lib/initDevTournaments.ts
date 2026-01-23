/**
 * Script to initialize development tournaments in the database
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, Timestamp } from 'firebase/firestore';
import { devTournamentTemplates } from './tournamentConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface DevTournament {
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  [key: string]: unknown;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Initialize development tournaments
 */
export const initializeDevTournaments = async (): Promise<void> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    console.log('Initializing development tournaments...');
    
    // Check if tournaments already exist
    const existingTournaments = await getDocs(collection(db, 'devTournaments'));
    
    if (existingTournaments.empty) {
      // Add development tournament templates
      for (const [key, template] of Object.entries(devTournamentTemplates)) {
        const tournament: DevTournament = {
          ...template,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          id: `${key}-dev`
        } as DevTournament;
        
        if (!db) {
          throw new Error('Firebase db not initialized');
        }
        await addDoc(collection(db, 'devTournaments'), tournament);
        console.log(`${(template as { name?: string }).name || key} tournament added to development`);
      }
      
      console.log('All development tournaments initialized successfully');
    } else {
      console.log('Development tournaments already exist');
    }
  } catch (error) {
    console.error('Error initializing development tournaments:', error);
    throw error;
  }
};

/**
 * Function to add a specific tournament to development
 */
export const addTournamentToDevelopment = async (tournamentKey: string): Promise<DevTournament> => {
  if (!db) {
    throw new Error('Firebase db not initialized');
  }
  try {
    const template = devTournamentTemplates[tournamentKey as keyof typeof devTournamentTemplates];
    if (!template) {
      throw new Error(`Tournament template '${tournamentKey}' not found`);
    }
    
    const tournament: DevTournament = {
      ...template,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      id: `${tournamentKey}-dev`
    } as DevTournament;
    
    await addDoc(collection(db, 'devTournaments'), tournament);
    console.log(`${(template as { name?: string }).name || tournamentKey} tournament added to development`);
    
    return tournament;
  } catch (error) {
    console.error('Error adding tournament to development:', error);
    throw error;
  }
};

// CommonJS exports for backward compatibility
module.exports = {
  initializeDevTournaments,
  addTournamentToDevelopment
};
