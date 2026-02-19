/**
 * Player Repository
 *
 * Typed repository for players collection
 */

import { where, orderBy, Timestamp } from 'firebase/firestore';

import { getFirebaseAdapter } from '@/lib/firebase/firebaseAdapter';
import { type PlayerFull, type FantasyPosition } from '@/types';

import { BaseRepository } from './baseRepository';

/**
 * Generic player document type for Firestore
 */
export interface FirestorePlayer extends Partial<PlayerFull> {
  id: string;
  name?: string;
  displayName?: string;
  position?: FantasyPosition;
  team?: string;
  nflTeam?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

/**
 * Repository for player documents (/players/{playerId})
 */
class PlayerRepository extends BaseRepository<FirestorePlayer> {
  constructor() {
    super('players', getFirebaseAdapter());
  }

  /**
   * Get a player by ID
   */
  async getById(playerId: string): Promise<FirestorePlayer | null> {
    return this.get(playerId);
  }

  /**
   * Get players by position
   */
  async getByPosition(position: string): Promise<FirestorePlayer[]> {
    return this.queryWhere('position', '==', position);
  }

  /**
   * Get players by NFL team
   */
  async getByTeam(team: string): Promise<FirestorePlayer[]> {
    return this.queryWhere('team', '==', team, {
      limitCount: 100,
    });
  }

  /**
   * Get players by multiple positions
   */
  async getByPositions(positions: string[]): Promise<FirestorePlayer[]> {
    return this.query([where('position', 'in', positions)]);
  }

  /**
   * Search players by name
   */
  async searchByName(namePrefix: string): Promise<FirestorePlayer[]> {
    const upperBound = namePrefix.slice(0, -1) +
      String.fromCharCode(namePrefix.charCodeAt(namePrefix.length - 1) + 1);

    return this.query([
      where('name', '>=', namePrefix),
      where('name', '<', upperBound),
    ]);
  }

  /**
   * Get all players (with optional limit)
   */
  async getAll(limit: number = 500): Promise<FirestorePlayer[]> {
    return this.query([], { limitCount: limit });
  }

  /**
   * Update player information
   */
  async updatePlayer(playerId: string, updates: Partial<FirestorePlayer>): Promise<void> {
    await this.update(playerId, updates);
  }

  /**
   * Delete a player
   */
  async deletePlayer(playerId: string): Promise<void> {
    await this.delete(playerId);
  }
}

// Singleton instance
let playerRepositoryInstance: PlayerRepository | null = null;

/**
 * Get the singleton PlayerRepository instance
 */
export function getPlayerRepository(): PlayerRepository {
  if (!playerRepositoryInstance) {
    playerRepositoryInstance = new PlayerRepository();
  }
  return playerRepositoryInstance;
}

// Default export
export const playerRepository = getPlayerRepository();
