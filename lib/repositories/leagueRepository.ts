/**
 * League/Tournament Repository
 *
 * Typed repository for tournaments collection
 */

import { where, orderBy } from 'firebase/firestore';

import { getFirebaseAdapter } from '@/lib/firebase/firebaseAdapter';
import { type FirestoreTournament } from '@/types/firestore';

import { BaseRepository } from './baseRepository';

/**
 * Repository for tournament documents (/tournaments/{tournamentId})
 * Also supports accessing the legacy /devTournaments collection
 */
class LeagueRepository extends BaseRepository<FirestoreTournament> {
  private devTournamentsRepository: DevTournamentsRepository;

  constructor(adapter = getFirebaseAdapter()) {
    super('tournaments', adapter);
    this.devTournamentsRepository = new DevTournamentsRepository(adapter);
  }

  /**
   * Get a tournament by ID
   */
  async getById(tournamentId: string): Promise<FirestoreTournament | null> {
    return this.get(tournamentId);
  }

  /**
   * Get all active tournaments
   */
  async getActive(): Promise<FirestoreTournament[]> {
    return this.queryWhere('status', 'in', ['upcoming', 'filling', 'active']);
  }

  /**
   * Get tournaments by status
   */
  async getByStatus(status: string): Promise<FirestoreTournament[]> {
    return this.queryWhere('status', '==', status);
  }

  /**
   * Get upcoming tournaments
   */
  async getUpcoming(): Promise<FirestoreTournament[]> {
    return this.queryWhere('status', '==', 'upcoming', {
      orderByField: 'draftWindowStart',
      orderDirection: 'asc',
      limitCount: 50,
    });
  }

  /**
   * Get filling tournaments (accepting entries)
   */
  async getFilling(): Promise<FirestoreTournament[]> {
    return this.queryWhere('status', '==', 'filling', {
      limitCount: 50,
    });
  }

  /**
   * Get all tournaments (with limit)
   */
  async getAll(limit: number = 100): Promise<FirestoreTournament[]> {
    return this.query([], {
      orderByField: 'draftWindowStart',
      orderDirection: 'desc',
      limitCount: limit,
    });
  }

  /**
   * Create a new tournament
   */
  async createTournament(tournamentId: string, data: Omit<FirestoreTournament, 'id'>): Promise<void> {
    await this.set(tournamentId, { ...data, id: tournamentId } as FirestoreTournament);
  }

  /**
   * Update tournament status
   */
  async updateStatus(tournamentId: string, status: string): Promise<void> {
    await this.update(tournamentId, {
      status,
    } as Partial<FirestoreTournament>);
  }

  /**
   * Update current entries count
   */
  async updateEntryCount(tournamentId: string, currentEntries: number): Promise<void> {
    await this.update(tournamentId, {
      currentEntries,
    } as Partial<FirestoreTournament>);
  }

  /**
   * Access dev tournaments
   */
  devTournaments(): DevTournamentsRepository {
    return this.devTournamentsRepository;
  }

  /**
   * Delete a tournament
   */
  async deleteTournament(tournamentId: string): Promise<void> {
    await this.delete(tournamentId);
  }
}

/**
 * Sub-repository for development/test tournaments
 */
class DevTournamentsRepository extends BaseRepository<FirestoreTournament> {
  constructor(adapter = getFirebaseAdapter()) {
    super('devTournaments', adapter);
  }

  /**
   * Get a dev tournament by ID
   */
  async getById(tournamentId: string): Promise<FirestoreTournament | null> {
    return this.get(tournamentId);
  }

  /**
   * Get all dev tournaments
   */
  async getAll(limit: number = 100): Promise<FirestoreTournament[]> {
    return this.query([], {
      orderByField: 'draftWindowStart',
      orderDirection: 'desc',
      limitCount: limit,
    });
  }

  /**
   * Create a dev tournament
   */
  async createWithId(tournamentId: string, data: Omit<FirestoreTournament, 'id'>): Promise<void> {
    await this.set(tournamentId, { ...data, id: tournamentId } as FirestoreTournament);
  }

  /**
   * Delete a dev tournament
   */
  async delete(tournamentId: string): Promise<void> {
    await this.delete(tournamentId);
  }
}

// Singleton instance
let leagueRepositoryInstance: LeagueRepository | null = null;

/**
 * Get the singleton LeagueRepository instance
 */
export function getLeagueRepository(): LeagueRepository {
  if (!leagueRepositoryInstance) {
    leagueRepositoryInstance = new LeagueRepository();
  }
  return leagueRepositoryInstance;
}

// Default export
export const leagueRepository = getLeagueRepository();
