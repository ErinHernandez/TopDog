/**
 * Script to initialize development tournaments in the database
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, Timestamp } from 'firebase/firestore';
import { devTournamentTemplates } from './tournamentConfig';
import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[InitDevTournaments]');

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
    logger.info('Initializing development tournaments');
    
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
        logger.debug('Tournament added to development', { name: (template as { name?: string }).name || key });
      }

      logger.info('All development tournaments initialized successfully');
    } else {
      logger.debug('Development tournaments already exist');
    }
  } catch (error) {
    logger.error('Error initializing development tournaments', error instanceof Error ? error : new Error(String(error)));
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
    logger.info('Tournament added to development', { name: (template as { name?: string }).name || tournamentKey });

    return tournament;
  } catch (error) {
    logger.error('Error adding tournament to development', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

// CommonJS exports for backward compatibility
module.exports = {
  initializeDevTournaments,
  addTournamentToDevelopment
};
